import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { profileImage } from "../middleware/uploads.js";
import { publicUser } from "../middleware/validation.js";

const router = Router();

router.get("/profile", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put("/profile", requireAuth, profileImage, async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  if (!name || name.length > 120) {
    return res.status(400).json({ message: "Enter a name up to 120 characters." });
  }

  const profilePic = req.file
    ? `${req.protocol}://${req.get("host")}/uploads/profiles/${req.file.filename}`
    : req.body.removeProfilePic === "true"
      ? null
      : req.user.profile_pic;
  const phone = String(req.body.phone || "").trim() || null;
  const address = String(req.body.address || "").trim() || null;

  const { rows } = await pool.query(
    `UPDATE users
     SET name = $1, phone = $2, address = $3, profile_pic = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING id, name, email, role, phone, address, profile_pic, status`,
    [name, phone, address, profilePic, req.user.id],
  );
  return res.json({ success: true, user: publicUser(rows[0]) });
});

export default router;
