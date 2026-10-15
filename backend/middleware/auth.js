import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export async function optionalAuth(req, res, next) {
  const authorization = req.get("authorization");
  if (!authorization) return next();

  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Invalid authorization header." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT id, name, email, role, phone, address, profile_pic, status
       FROM users WHERE id = $1`,
      [payload.sub],
    );

    if (!rows[0] || rows[0].status !== "active") {
      return res.status(401).json({ message: "Your account is unavailable." });
    }

    req.user = rows[0];
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
