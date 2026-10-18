import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/stats", async (req, res) => {
  const [totalUsers, totalProperties, activeListings, soldProperties] =
    await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.property.count({ where: { status: { in: ["sale", "rent", "active"] } } }),
      prisma.property.count({ where: { status: { in: ["sold", "rented"] } } }),
    ]);
  return res.json({
    success: true,
    stats: { totalUsers, totalProperties, activeListings, soldProperties },
  });
});

router.get("/users", async (req, res) => {
  const search = String(req.query.search || "").trim();
  const role = String(req.query.role || "");
  const users = await prisma.user.findMany({
    where: {
      ...(role && ["buyer", "seller", "admin"].includes(role) ? { role } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      profilePic: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return res.json({
    success: true,
    users: users.map((user) => ({
      ...user,
      _id: user.id,
    })),
  });
});

router.patch("/users/:id/status", async (req, res) => {
  const status = String(req.body.status || "").toLowerCase();
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "Status must be active or inactive." });
  }
  if (req.params.id === req.user.id && status === "inactive") {
    return res.status(400).json({ message: "You cannot deactivate your own account." });
  }

  const target = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: { id: true, role: true, status: true },
  });
  if (!target) return res.status(404).json({ message: "User not found." });
  if (target.role === "admin" && target.status === "active" && status === "inactive") {
    const activeAdmins = await prisma.user.count({
      where: { role: "admin", status: "active" },
    });
    if (activeAdmins <= 1) {
      return res.status(409).json({ message: "The last active admin account cannot be deactivated." });
    }
  }

  const user = await prisma.user.update({
    where: { id: target.id },
    data: { status },
    select: { id: true, name: true, email: true, phone: true, role: true, status: true },
  });
  return res.json({ success: true, user: { ...user, _id: user.id } });
});

router.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }

  let result;
  try {
    result = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, role: true, status: true },
      });
      if (!user) return { error: "not-found" };

      if (user.role === "admin" && user.status === "active") {
        const remainingAdmins = await transaction.user.count({
          where: {
            role: "admin",
            status: "active",
            id: { not: user.id },
          },
        });
        if (remainingAdmins === 0) return { error: "last-admin" };
      }

      await transaction.user.delete({ where: { id: user.id } });
      return { error: null };
    });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(409).json({
        message: "This user owns property listings. Delete or reassign those listings before removing the account.",
      });
    }
    throw error;
  }

  if (result.error === "not-found") {
    return res.status(404).json({ message: "User not found." });
  }
  if (result.error === "last-admin") {
    return res.status(409).json({ message: "The last active admin account cannot be deleted." });
  }
  return res.json({ success: true, message: "User deleted." });
});

router.get("/contacts", async (req, res) => {
  const messages = await prisma.contactMessage.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      message: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return res.json({
    success: true,
    messages: messages.map((message) => ({ ...message, _id: message.id })),
  });
});

export default router;
