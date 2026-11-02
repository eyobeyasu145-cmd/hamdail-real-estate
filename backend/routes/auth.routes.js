import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../db.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { normalizePhoneNumber, normalizeUsername, publicUser } from "../middleware/validation.js";
import { sendAuthCodeEmail } from "../utils/email.js";
import {
  AUTH_CODE_MAX_ATTEMPTS,
  AUTH_CODE_RESEND_MS,
  AUTH_CODE_TTL_MS,
  authCodeMatches,
  generateAuthCode,
  hashAuthCode,
  passwordPolicyError,
} from "../utils/authSecurity.js";

const router = Router();
const googleClient = new OAuth2Client();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function authRateLimit(limit, message) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
  });
}

const loginLimiter = authRateLimit(10, "Too many sign-in attempts. Try again later.");
const registerLimiter = authRateLimit(5, "Too many account creation attempts. Try again later.");
const googleLoginLimiter = authRateLimit(10, "Too many Google sign-in attempts. Try again later.");
const codeRequestLimiter = authRateLimit(3, "Too many code requests. Try again later.");
const codeCheckLimiter = authRateLimit(10, "Too many code attempts. Try again later.");

class AuthEmailDeliveryError extends Error {
  constructor(cause) {
    super("Authentication email could not be delivered.", { cause });
    this.name = "AuthEmailDeliveryError";
    this.code = cause?.code || "EMAIL_DELIVERY_FAILED";
  }
}

function signToken(user) {
  return jwt.sign({ sub: user.id, ver: user.tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

async function requestAuthCode(user, purpose) {
  const now = new Date();
  const where = { userId_purpose: { userId: user.id, purpose } };
  const code = await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${`${user.id}:${purpose}`}, 0))
    `;
    const existing = await transaction.authCode.findUnique({ where });
    if (existing && now.getTime() - existing.createdAt.getTime() < AUTH_CODE_RESEND_MS) {
      return null;
    }

    const generatedCode = generateAuthCode();
    await transaction.authCode.upsert({
      where,
      create: {
        userId: user.id,
        purpose,
        codeHash: hashAuthCode(user.id, purpose, generatedCode),
        expiresAt: new Date(now.getTime() + AUTH_CODE_TTL_MS),
        createdAt: now,
      },
      update: {
        codeHash: hashAuthCode(user.id, purpose, generatedCode),
        expiresAt: new Date(now.getTime() + AUTH_CODE_TTL_MS),
        attempts: 0,
        createdAt: now,
      },
    });
    return generatedCode;
  });
  if (!code) return false;
  try {
    await sendAuthCodeEmail({ email: user.email, code, purpose });
  } catch (error) {
    throw new AuthEmailDeliveryError(error);
  }
  return true;
}

async function consumeAuthCode({ user, purpose, code, passwordHash }) {
  const where = { userId_purpose: { userId: user.id, purpose } };
  const authCode = await prisma.authCode.findUnique({ where });
  const now = new Date();
  if (!authCode || authCode.expiresAt <= now || authCode.attempts >= AUTH_CODE_MAX_ATTEMPTS) {
    if (authCode) await prisma.authCode.deleteMany({ where: { id: authCode.id } });
    return false;
  }

  if (!authCodeMatches(authCode.codeHash, user.id, purpose, code)) {
    await prisma.authCode.updateMany({
      where: { id: authCode.id, attempts: { lt: AUTH_CODE_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  return prisma.$transaction(async (transaction) => {
    const consumed = await transaction.authCode.deleteMany({
      where: {
        id: authCode.id,
        codeHash: authCode.codeHash,
        expiresAt: { gt: now },
        attempts: { lt: AUTH_CODE_MAX_ATTEMPTS },
      },
    });
    if (consumed.count !== 1) return false;

    if (purpose === "email_verification") {
      await transaction.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    } else {
      await transaction.user.update({
        where: { id: user.id },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
    }
    return true;
  });
}

function validEmail(email) {
  return emailPattern.test(email) && email.length <= 254;
}

function logEmailFailure(error) {
  console.error("Authentication email delivery failed:", error.code || error.name || "unknown error");
}

function requestBody(req) {
  return req.body && typeof req.body === "object" ? req.body : {};
}

router.post("/register", registerLimiter, async (req, res) => {
  const body = requestBody(req);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  let username;
  try {
    username = normalizeUsername(body.username);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  let phone;
  try {
    phone = normalizePhoneNumber(body.phone);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  const password = String(body.password || "");
  const role = String(body.role || "buyer").toLowerCase();

  if (!name || name.length > 120) {
    return res.status(400).json({ message: "Enter a name up to 120 characters." });
  }
  if (!validEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  const passwordError = passwordPolicyError(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }
  if (role !== "buyer") {
    return res.status(400).json({ message: "Only buyer accounts can be created through public registration." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await prisma.user.create({
      data: { name, username, email, phone, passwordHash, role },
    });
    try {
      await requestAuthCode(user, "email_verification");
    } catch (error) {
      if (!(error instanceof AuthEmailDeliveryError)) throw error;
      logEmailFailure(error);
      return res.status(503).json({
        message: "Your account was created, but the verification email could not be sent. Configure email delivery and request another code.",
        email: user.email,
      });
    }
    return res.status(201).json({
      success: true,
      message: "Account created. Enter the verification code sent to your email.",
      email: user.email,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "That email or username is already in use." });
    }
    throw error;
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  const body = requestBody(req);
  const identifier = String(body.identifier ?? body.email ?? "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!identifier || !password) {
    return res.status(400).json({ message: "Username or email and password are required." });
  }

  const user = await prisma.user.findUnique({
    where: validEmail(identifier) ? { email: identifier } : { username: identifier },
  });
  if (!user || user.status !== "active" || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid username/email or password." });
  }
  if (!user.emailVerified) {
    return res.status(403).json({
      message: "Verify your email before signing in. You can request a new code.",
      code: "EMAIL_NOT_VERIFIED",
      email: user.email,
    });
  }

  return res.json({ success: true, user: publicUser(user), token: signToken(user) });
});

router.post("/google", googleLoginLimiter, async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({ message: "Google sign-in is not configured on the server." });
  }

  const body = requestBody(req);
  const credential = body.credential;
  const role = String(body.role || "buyer").toLowerCase();
  if (typeof credential !== "string" || !credential || credential.length > 8192) {
    return res.status(400).json({ message: "A valid Google credential is required." });
  }
  if (role !== "buyer") {
    return res.status(400).json({ message: "Only buyer accounts can be created through public registration." });
  }

  let googleProfile;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    googleProfile = ticket.getPayload();
  } catch (error) {
    console.warn(
      "Google sign-in credential verification failed:",
      error.code || error.name || "unknown error",
    );
    return res.status(401).json({ message: "The Google sign-in credential is invalid or expired." });
  }

  const email = String(googleProfile?.email || "").trim().toLowerCase();
  if (
    !googleProfile?.sub ||
    googleProfile.email_verified !== true ||
    !validEmail(email)
  ) {
    return res.status(401).json({ message: "Use a Google account with a verified email address." });
  }

  const name = String(googleProfile.name || email.split("@")[0]).trim().slice(0, 120) || email;
  const user = await prisma.user.upsert({
    where: { email },
    update: { emailVerified: true },
    create: {
      name,
      username: `google-${randomBytes(12).toString("hex")}`,
      email,
      passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
      role,
      emailVerified: true,
    },
  });

  if (user.status !== "active") {
    return res.status(403).json({ message: "This account is inactive. Contact support for help." });
  }

  return res.json({ success: true, user: publicUser(user), token: signToken(user) });
});

router.post("/verify-email", codeCheckLimiter, async (req, res) => {
  const body = requestBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  if (!validEmail(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Enter a valid email and six-digit code." });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) {
    return res.status(400).json({ message: "The code is invalid or expired. Request a new code and try again." });
  }
  const verified = await consumeAuthCode({
    user,
    purpose: "email_verification",
    code,
  });
  if (!verified) {
    return res.status(400).json({ message: "The code is invalid or expired. Request a new code and try again." });
  }
  return res.json({ success: true, message: "Email verified. You can now sign in." });
});

router.post("/resend-verification", codeRequestLimiter, async (req, res) => {
  const email = String(requestBody(req).email || "").trim().toLowerCase();
  if (validEmail(email)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
      try {
        await requestAuthCode(user, "email_verification");
      } catch (error) {
        if (!(error instanceof AuthEmailDeliveryError)) throw error;
        logEmailFailure(error);
      }
    }
  }
  return res.json({
    success: true,
    message: "If an unverified account matches that email, a verification code will be sent.",
  });
});

router.post("/forgot-password", codeRequestLimiter, async (req, res) => {
  const email = String(requestBody(req).email || "").trim().toLowerCase();
  if (validEmail(email)) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.emailVerified && user.status === "active") {
      try {
        await requestAuthCode(user, "password_reset");
      } catch (error) {
        if (!(error instanceof AuthEmailDeliveryError)) throw error;
        logEmailFailure(error);
      }
    }
  }
  return res.json({
    success: true,
    message: "If a verified account matches that email, a password reset code will be sent.",
  });
});

router.post("/reset-password", codeCheckLimiter, async (req, res) => {
  const body = requestBody(req);
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  const password = String(body.password || "");
  if (!validEmail(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: "Enter a valid email and six-digit code." });
  }
  const passwordError = passwordPolicyError(password);
  if (passwordError) return res.status(400).json({ message: passwordError });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.emailVerified) {
    return res.status(400).json({ message: "The code is invalid or expired. Request a new code and try again." });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const reset = await consumeAuthCode({
    user,
    purpose: "password_reset",
    code,
    passwordHash,
  });
  if (!reset) {
    return res.status(400).json({ message: "The code is invalid or expired. Request a new code and try again." });
  }
  return res.json({ success: true, message: "Password reset successfully. Sign in with your new password." });
});

router.get("/me", optionalAuth, requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
