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
    profilePic: user.profilePic,
    status: user.status,
    emailVerified: user.emailVerified,
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
      row.securityDeposit === null ? null : Number(row.securityDeposit),
    maintenance: row.maintenance === null ? null : Number(row.maintenance),
    city: row.city,
    area: row.area,
    locality: row.area,
    pincode: row.pincode,
    propertyType: row.propertyType,
    bhk: row.bhk,
    bathrooms: row.bathrooms,
    areaSize: row.areaSize === null ? null : Number(row.areaSize),
    furnishing: row.furnishing,
    amenities: row.amenities,
    status: row.status,
    images: row.images,
    isVerified: row.isVerified,
    views: row.views,
    sellerId: row.sellerId,
    seller: {
      _id: row.seller.id,
      name: row.seller.name,
      email: row.seller.email,
      phone: row.seller.phone,
      profilePic: row.seller.profilePic,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
