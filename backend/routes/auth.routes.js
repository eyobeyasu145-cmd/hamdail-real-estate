import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { publicUser } from "../middleware/validation.js";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

router.post("/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "buyer").toLowerCase();

  if (!name || name.length > 120) {
    return res.status(400).json({ message: "Enter a name up to 120 characters." });
  }
  if (!emailPattern.test(email) || email.length > 254) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must have at least 8 characters." });
  }
  if (!["buyer", "seller"].includes(role)) {
    return res.status(400).json({ message: "Choose buyer or seller as the account type." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, phone, address, profile_pic, status`,
      [name, email, passwordHash, role],
    );
    const user = rows[0];
    return res.status(201).json({
      success: true,
      user: publicUser(user),
      token: signToken(user),
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    throw error;
  }
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const { rows } = await pool.query(
    `SELECT id, name, email, password_hash, role, phone, address, profile_pic, status
     FROM users WHERE email = $1`,
    [email],
  );
  const user = rows[0];
  if (!user || user.status !== "active" || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  return res.json({ success: true, user: publicUser(user), token: signToken(user) });
});

router.get("/me", optionalAuth, requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
