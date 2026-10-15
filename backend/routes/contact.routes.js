import { Router } from "express";
import { pool } from "../db.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/", optionalAuth, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const message = String(req.body.message || "").trim();

  if (!name || name.length > 120) {
    return res.status(400).json({ message: "Enter your name (up to 120 characters)." });
  }
  if (!emailPattern.test(email) || email.length > 254) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }
  if (!phone || phone.length > 40) {
    return res.status(400).json({ message: "Enter a valid phone number." });
  }
  if (!message || message.length > 5000) {
    return res.status(400).json({ message: "Message is required and must be under 5000 characters." });
  }

  await pool.query(
    `INSERT INTO contact_messages (name, email, phone, message, role)
     VALUES ($1, $2, $3, $4, $5)`,
    [name, email, phone, message, req.user?.role || null],
  );
  return res.status(201).json({ success: true, message: "Message submitted successfully." });
});

export default router;
