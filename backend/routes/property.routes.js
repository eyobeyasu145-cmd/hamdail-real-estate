import { Router } from "express";
import { pool } from "../db.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { propertyImages } from "../middleware/uploads.js";
import {
  parseOptionalNumber,
  parseStringArray,
  publicProperty,
} from "../middleware/validation.js";

const router = Router();
const selectableStatuses = new Set(["sale", "rent", "sold", "rented", "active", "pending"]);
const allowedFields = [
  "title",
  "description",
  "price",
  "city",
  "area",
  "pincode",
  "propertyType",
  "bhk",
  "bathrooms",
  "areaSize",
  "furnishing",
  "status",
  "amenities",
];

const propertySelect = `
  SELECT p.*, u.name AS seller_name, u.email AS seller_email,
         u.phone AS seller_phone, u.profile_pic AS seller_profile_pic
  FROM properties p
  JOIN users u ON u.id = p.seller_id
`;

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

function propertyValues(data) {
  const columns = {
    title: "title",
    description: "description",
    price: "price",
    securityDeposit: "security_deposit",
    maintenance: "maintenance",
    city: "city",
    area: "area",
    pincode: "pincode",
    propertyType: "property_type",
    bhk: "bhk",
    bathrooms: "bathrooms",
    areaSize: "area_size",
    furnishing: "furnishing",
    status: "status",
    amenities: "amenities",
  };
  return Object.entries(data).map(([key, value]) => [columns[key], value]);
}

async function requirePropertyOwner(req, res, next) {
  const { rows } = await pool.query(
    "SELECT id, seller_id, images FROM properties WHERE id = $1",
    [req.params.id],
  );
  const property = rows[0];
  if (!property) return res.status(404).json({ message: "Property not found." });
  if (req.user.role !== "admin" && property.seller_id !== req.user.id) {
    return res.status(403).json({ message: "You may only edit your own listings." });
  }
  req.property = property;
  return next();
}

router.get("/", optionalAuth, async (req, res) => {
  const conditions = [];
  const values = [];
  const add = (sql, value) => {
    values.push(value);
    conditions.push(sql.replace("?", `$${values.length}`));
  };

  if (req.user?.role === "seller") {
    add("p.seller_id = ?", req.user.id);
  } else if (req.user?.role !== "admin") {
    add("p.status = ANY(?)", ["sale", "rent", "active"]);
  }

  for (const field of ["city", "area", "propertyType", "bhk", "furnishing"]) {
    if (!req.query[field]) continue;
    const column = {
      city: "p.city",
      area: "p.area",
      propertyType: "p.property_type",
      bhk: "p.bhk",
      furnishing: "p.furnishing",
    }[field];
    if (["propertyType", "bhk", "furnishing"].includes(field)) {
      const filters = String(req.query[field]).split(",").map((item) => item.trim()).filter(Boolean);
      if (filters.length) add(`${column} = ANY(?)`, filters);
    } else {
      add(`${column} ILIKE ?`, `%${String(req.query[field]).replace(/[%_]/g, "\\$&")}%`);
    }
  }

  if (req.query.status && req.query.status !== "all") {
    const status = String(req.query.status).toLowerCase();
    if (!selectableStatuses.has(status)) return res.status(400).json({ message: "Invalid property status." });
    add("p.status = ?", status);
  }
  if (req.query.minPrice !== undefined) {
    let minPrice;
    try {
      minPrice = parseOptionalNumber(req.query.minPrice, "minPrice");
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    if (minPrice === null || minPrice < 0) return res.status(400).json({ message: "minPrice must be zero or more." });
    add("p.price >= ?", minPrice);
  }
  if (req.query.maxPrice !== undefined) {
    let maxPrice;
    try {
      maxPrice = parseOptionalNumber(req.query.maxPrice, "maxPrice");
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    if (maxPrice === null || maxPrice < 0) return res.status(400).json({ message: "maxPrice must be zero or more." });
    add("p.price <= ?", maxPrice);
  }
  if (req.query.amenities) {
    const amenities = String(req.query.amenities).split(",").map((item) => item.trim()).filter(Boolean);
    if (amenities.length) add("p.amenities @> ?", amenities);
  }

  const orderBy = {
    priceLow: "p.price ASC, p.created_at DESC",
    priceHigh: "p.price DESC, p.created_at DESC",
    latest: "p.created_at DESC",
  }[req.query.sort] || "p.created_at DESC";
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `${propertySelect} ${where} ORDER BY ${orderBy} LIMIT 200`,
    values,
  );
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

  const fields = propertyValues(data);
  const columns = fields.map(([column]) => column);
  const values = fields.map(([, value]) => value);
  columns.push("images", "seller_id");
  values.push(images, req.user.id);
  const placeholders = values.map((_, index) => `$${index + 1}`);

  const { rows } = await pool.query(
    `WITH inserted AS (
       INSERT INTO properties (${columns.join(", ")})
       VALUES (${placeholders.join(", ")})
       RETURNING *
     )
     ${propertySelect.replace("FROM properties p", "FROM inserted p")}`,
    values,
  );
  return res.status(201).json({ success: true, property: publicProperty(rows[0]) });
});

router.get("/:id", optionalAuth, async (req, res) => {
  const { rows } = await pool.query(`${propertySelect} WHERE p.id = $1`, [req.params.id]);
  const row = rows[0];
  if (!row) return res.status(404).json({ message: "Property not found." });

  const isOwner = req.user?.id === row.seller_id;
  const canViewPrivate = isOwner || req.user?.role === "admin";
  if (!canViewPrivate && !["sale", "rent", "active"].includes(row.status)) {
    return res.status(404).json({ message: "Property not found." });
  }
  if (!canViewPrivate) {
    await pool.query("UPDATE properties SET views = views + 1 WHERE id = $1", [row.id]);
    row.views += 1;
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

  const fields = propertyValues(data);
  fields.push(["images", images], ["updated_at", new Date()]);
  const values = fields.map(([, value]) => value);
  const assignments = fields.map(([column], index) => `${column} = $${index + 1}`);
  values.push(req.params.id);
  const updated = await pool.query(
    `UPDATE properties SET ${assignments.join(", ")} WHERE id = $${values.length} RETURNING id`,
    values,
  );
  const { rows } = await pool.query(`${propertySelect} WHERE p.id = $1`, [updated.rows[0].id]);
  return res.json({ success: true, property: publicProperty(rows[0]) });
  },
);

router.delete("/:id", requireAuth, requireRole("seller", "admin"), async (req, res) => {
  const { rows } = await pool.query(
    "SELECT seller_id FROM properties WHERE id = $1",
    [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ message: "Property not found." });
  if (req.user.role !== "admin" && rows[0].seller_id !== req.user.id) {
    return res.status(403).json({ message: "You may only delete your own listings." });
  }

  await pool.query("DELETE FROM properties WHERE id = $1", [req.params.id]);
  return res.json({ success: true, message: "Property deleted." });
});

export default router;
