import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const AUTH_CODE_TTL_MS = 10 * 60 * 1000;
export const AUTH_CODE_RESEND_MS = 60 * 1000;
export const AUTH_CODE_MAX_ATTEMPTS = 5;

export function passwordPolicyError(password) {
  if (typeof password !== "string" || Buffer.byteLength(password, "utf8") > 72) {
    return "Password must be no more than 72 UTF-8 bytes.";
  }
  if (password.length < 12) {
    return "Password must have at least 12 characters.";
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Password must include uppercase and lowercase letters, a number, and a symbol.";
  }
  return null;
}

export function generateAuthCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashAuthCode(userId, purpose, code, secret = process.env.JWT_SECRET) {
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured before generating authentication codes.");
  }
  return createHmac("sha256", secret)
    .update(`${userId}:${purpose}:${code}`)
    .digest("hex");
}

export function authCodeMatches(expectedHash, userId, purpose, code, secret = process.env.JWT_SECRET) {
  const actualHash = hashAuthCode(userId, purpose, code, secret);
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(actualHash, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
