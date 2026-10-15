export function parseStringArray(value, fieldName) {
  if (value === undefined || value === null || value === "") return [];
  if (Array.isArray(value)) return value.map(String);

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    throw new Error(`${fieldName} must be an array.`);
  }

  if (Array.isArray(parsed)) return parsed.map(String);
  throw new Error(`${fieldName} must be a JSON array or comma-separated string.`);
}

export function parseOptionalNumber(value, fieldName, { integer = false } = {}) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || (integer && !Number.isInteger(number))) {
    throw new Error(`${fieldName} must be a valid ${integer ? "integer" : "number"}.`);
  }
  return number;
}

export function publicUser(user) {
  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    profilePic: user.profile_pic,
    status: user.status,
  };
}

export function publicProperty(row) {
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    securityDeposit:
      row.security_deposit === null ? null : Number(row.security_deposit),
    maintenance: row.maintenance === null ? null : Number(row.maintenance),
    city: row.city,
    area: row.area,
    locality: row.area,
    pincode: row.pincode,
    propertyType: row.property_type,
    bhk: row.bhk,
    bathrooms: row.bathrooms,
    areaSize: row.area_size === null ? null : Number(row.area_size),
    furnishing: row.furnishing,
    amenities: row.amenities,
    status: row.status,
    images: row.images,
    isVerified: row.is_verified,
    views: row.views,
    sellerId: row.seller_id,
    seller: {
      _id: row.seller_id,
      name: row.seller_name,
      email: row.seller_email,
      phone: row.seller_phone,
      profilePic: row.seller_profile_pic,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
