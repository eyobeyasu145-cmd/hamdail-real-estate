import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/stats", async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::INTEGER FROM users) AS "totalUsers",
      (SELECT COUNT(*)::INTEGER FROM properties) AS "totalProperties",
      (SELECT COUNT(*)::INTEGER FROM properties WHERE status IN ('sale', 'rent', 'active')) AS "activeListings",
      (SELECT COUNT(*)::INTEGER FROM properties WHERE status IN ('sold', 'rented')) AS "soldProperties"
  `);
  return res.json({ success: true, stats: rows[0] });
});

router.get("/users", async (req, res) => {
  const search = String(req.query.search || "").trim();
  const role = String(req.query.role || "");
  const values = [];
  const conditions = [];

  if (search) {
    values.push(`%${search.replace(/[%_]/g, "\\$&")}%`);
    conditions.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length} OR COALESCE(phone, '') ILIKE $${values.length})`);
  }
  if (role && ["buyer", "seller", "admin"].includes(role)) {
    values.push(role);
    conditions.push(`role = $${values.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT id AS "_id", id, name, email, phone, role, status, profile_pic AS "profilePic", created_at AS "createdAt"
     FROM users ${where} ORDER BY created_at DESC LIMIT 500`,
    values,
  );
  return res.json({ success: true, users: rows });
});

router.patch("/users/:id/status", async (req, res) => {
  const status = String(req.body.status || "").toLowerCase();
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "Status must be active or inactive." });
  }
  if (req.params.id === req.user.id && status === "inactive") {
    return res.status(400).json({ message: "You cannot deactivate your own account." });
  }

  const { rows } = await pool.query(
    `UPDATE users SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id AS "_id", id, name, email, phone, role, status`,
    [status, req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ message: "User not found." });
  if (rows[0].role === "admin" && status === "inactive") {
    const { rows: admins } = await pool.query(
      "SELECT COUNT(*)::INTEGER AS count FROM users WHERE role = 'admin' AND status = 'active'",
    );
    if (admins[0].count === 0) {
      await pool.query(
        "UPDATE users SET status = 'active', updated_at = NOW() WHERE id = $1",
        [req.params.id],
      );
      return res.status(409).json({ message: "The last active admin account cannot be deactivated." });
    }
  }
  return res.json({ success: true, user: rows[0] });
});

router.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT id, role FROM users WHERE id = $1 FOR UPDATE",
      [req.params.id],
    );
    const user = rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found." });
    }
    if (user.role === "admin") {
      const { rows: admins } = await client.query(
        `SELECT COUNT(*)::INTEGER AS count FROM users
         WHERE role = 'admin' AND status = 'active' AND id <> $1`,
        [req.params.id],
      );
      if (user.status === "active" && admins[0].count === 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "The last active admin account cannot be deleted." });
      }
    }
    await client.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    await client.query("COMMIT");
    return res.json({ success: true, message: "User deleted." });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23503") {
      return res.status(409).json({
        message: "This user owns property listings. Delete or reassign those listings before removing the account.",
      });
    }
    throw error;
  } finally {
    client.release();
  }
});

router.get("/contacts", async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id AS "_id", id, name, email, phone, message, role, status,
            created_at AS "createdAt"
     FROM contact_messages ORDER BY created_at DESC LIMIT 500`,
  );
  return res.json({ success: true, messages: rows });
});

export default router;
