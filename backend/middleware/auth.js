import jwt from "jsonwebtoken";
import { prisma } from "../db.js";

export async function optionalAuth(req, res, next) {
  const authorization = req.get("authorization");
  if (!authorization) return next();

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Invalid authorization header." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return res.status(401).json({ message: "Your sign-in has expired. Please sign in again." });
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        profilePic: true,
        status: true,
        emailVerified: true,
        tokenVersion: true,
      },
    });

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Your account is unavailable." });
    }
    if (user.emailVerified !== true) {
      return res.status(403).json({ message: "Please verify your email before continuing.", code: "EMAIL_NOT_VERIFIED" });
    }
    if (payload.ver !== user.tokenVersion) {
      return res.status(401).json({ message: "Your sign-in has expired. Please sign in again." });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Your sign-in has expired. Please sign in again." });
    }
    return next(error);
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Please sign in to continue." });
  }
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You are not allowed to perform this action." });
    }
    return next();
  };
}
