import { Router } from "express";
import { prisma } from "../db.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { propertyImages } from "../middleware/uploads.js";
import {
  parseOptionalNumber,
  parseStringArray,
  publicProperty,
} from "../middleware/validation.js";

const router = Router();
const selectableStatuses = new Set(["sale", "rent", "sold", "rented", "active", "pending"]);
const publicStatuses = ["sale", "rent", "active"];
const propertyWithSeller = {
  seller: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profilePic: true,
    },
  },
};

function uploadedImageUrls(req) {
  return (req.files || []).map(
    (file) => `${req.protocol}://${req.get("host")}/uploads/properties/${file.filename}`,
  );
}

function parsePropertyBody(body, { create = false } = {}) {
  const data = {};
  const required = ["title", "description", "city", "area", "pincode", "propertyType"];

  for (const field of required) {
    const value = String(body[field] ?? "").trim();
    if ((create || body[field] !== undefined) && !value) {
      throw new Error(`${field} is required.`);
    }
    if (body[field] !== undefined) data[field] = value;
  }

  if (body.price !== undefined) {
    data.price = parseOptionalNumber(body.price, "price");
    if (data.price === null || data.price <= 0) throw new Error("Price must be greater than zero.");
  } else if (create) {
    throw new Error("price is required.");
  }
  for (const field of ["securityDeposit", "maintenance"]) {
    if (body[field] !== undefined) {
      data[field] = parseOptionalNumber(body[field], field);
      if (data[field] !== null && data[field] < 0) {
        throw new Error(`${field} cannot be negative.`);
      }
    }
  }

  if (body.bathrooms !== undefined) {
    data.bathrooms = parseOptionalNumber(body.bathrooms, "bathrooms", { integer: true });
  }
  if (body.areaSize !== undefined) {
    data.areaSize = parseOptionalNumber(body.areaSize, "areaSize");
  }
  for (const field of ["bhk", "furnishing"]) {
    if (body[field] !== undefined) data[field] = String(body[field]).trim() || null;
  }
  if (body.amenities !== undefined) {
    data.amenities = parseStringArray(body.amenities, "amenities");
  }
  if (body.status !== undefined) {
    const status = String(body.status).toLowerCase();
    if (!selectableStatuses.has(status)) throw new Error("Invalid property status.");
    data.status = status;
  }

  return data;
}

async function requirePropertyOwner(req, res, next) {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    select: { id: true, sellerId: true, images: true },
  });
  if (!property) return res.status(404).json({ message: "Property not found." });
  if (req.user.role !== "admin" && property.sellerId !== req.user.id) {
    return res.status(403).json({ message: "You may only edit your own listings." });
  }
  req.property = property;
  return next();
}

router.get("/", optionalAuth, async (req, res) => {
  const where = {};
  if (req.user?.role === "seller") {
    where.sellerId = req.user.id;
  } else if (req.user?.role !== "admin") {
    where.status = { in: publicStatuses };
  }

  for (const field of ["city", "area", "propertyType", "bhk", "furnishing"]) {
    if (!req.query[field]) continue;
    if (["propertyType", "bhk", "furnishing"].includes(field)) {
      const filters = String(req.query[field]).split(",").map((item) => item.trim()).filter(Boolean);
      if (filters.length) where[field] = { in: filters };
    } else {
      where[field] = {
        contains: String(req.query[field]),
        mode: "insensitive",
      };
    }
  }

  if (req.query.status && req.query.status !== "all") {
    const status = String(req.query.status).toLowerCase();
    if (!selectableStatuses.has(status)) {
      return res.status(400).json({ message: "Invalid property status." });
    }
    if (where.status && !publicStatuses.includes(status)) {
      return res.json({ success: true, count: 0, properties: [] });
    }
    where.status = status;
  }
  if (req.query.minPrice !== undefined) {
    let minPrice;
    try {
      minPrice = parseOptionalNumber(req.query.minPrice, "minPrice");
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    if (minPrice === null || minPrice < 0) {
      return res.status(400).json({ message: "minPrice must be zero or more." });
    }
    where.price = { ...where.price, gte: minPrice };
  }
  if (req.query.maxPrice !== undefined) {
    let maxPrice;
    try {
      maxPrice = parseOptionalNumber(req.query.maxPrice, "maxPrice");
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    if (maxPrice === null || maxPrice < 0) {
      return res.status(400).json({ message: "maxPrice must be zero or more." });
    }
    where.price = { ...where.price, lte: maxPrice };
  }
  if (req.query.amenities) {
    const amenities = String(req.query.amenities).split(",").map((item) => item.trim()).filter(Boolean);
    if (amenities.length) where.amenities = { hasEvery: amenities };
  }

  const orderBy = {
    priceLow: [{ price: "asc" }, { createdAt: "desc" }],
    priceHigh: [{ price: "desc" }, { createdAt: "desc" }],
    latest: { createdAt: "desc" },
  }[req.query.sort] || { createdAt: "desc" };
  const rows = await prisma.property.findMany({
    where,
    include: propertyWithSeller,
    orderBy,
    take: 200,
  });
  const properties = rows.map(publicProperty);
  return res.json({ success: true, count: properties.length, properties });
});

router.post("/", requireAuth, requireRole("seller", "admin"), propertyImages, async (req, res) => {
  let data;
  try {
    data = parsePropertyBody(req.body, { create: true });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const images = uploadedImageUrls(req);
  if (images.length === 0) return res.status(400).json({ message: "Upload at least one property image." });

  const property = await prisma.property.create({
    data: { ...data, images, sellerId: req.user.id },
    include: propertyWithSeller,
  });
  return res.status(201).json({ success: true, property: publicProperty(property) });
});

router.get("/:id", optionalAuth, async (req, res) => {
  const row = await prisma.property.findUnique({
    where: { id: req.params.id },
    include: propertyWithSeller,
  });
  if (!row) return res.status(404).json({ message: "Property not found." });

  const isOwner = req.user?.id === row.sellerId;
  const canViewPrivate = isOwner || req.user?.role === "admin";
  if (!canViewPrivate && !publicStatuses.includes(row.status)) {
    return res.status(404).json({ message: "Property not found." });
  }
  if (!canViewPrivate) {
    const updated = await prisma.property.update({
      where: { id: row.id },
      data: { views: { increment: 1 } },
      include: propertyWithSeller,
    });
    return res.json({ success: true, property: publicProperty(updated) });
  }

  return res.json({ success: true, property: publicProperty(row) });
});

router.put(
  "/:id",
  requireAuth,
  requireRole("seller", "admin"),
  requirePropertyOwner,
  propertyImages,
  async (req, res) => {
    let data;
    try {
      data = parsePropertyBody(req.body);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    let images = req.property.images;
    if (req.body.existingImages !== undefined) {
      try {
        const requestedImages = JSON.parse(req.body.existingImages);
        if (!Array.isArray(requestedImages)) throw new Error();
        images = req.property.images.filter((image) => requestedImages.includes(image));
      } catch {
        return res.status(400).json({ message: "existingImages must be a valid JSON array." });
      }
    }
    images = [...images, ...uploadedImageUrls(req)];
    if (images.length > 10) return res.status(400).json({ message: "A listing can have at most 10 images." });
    if (images.length === 0) return res.status(400).json({ message: "A listing must have at least one image." });

    const property = await prisma.property.update({
      where: { id: req.property.id },
      data: { ...data, images },
      include: propertyWithSeller,
    });
    return res.json({ success: true, property: publicProperty(property) });
  },
);

router.delete("/:id", requireAuth, requireRole("seller", "admin"), async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    select: { id: true, sellerId: true },
  });
  if (!property) return res.status(404).json({ message: "Property not found." });
  if (req.user.role !== "admin" && property.sellerId !== req.user.id) {
    return res.status(403).json({ message: "You may only delete your own listings." });
  }

  await prisma.property.delete({ where: { id: property.id } });
  return res.json({ success: true, message: "Property deleted." });
});

export default router;
