import test from "node:test";
import assert from "node:assert/strict";
import {
  parseOptionalNumber,
  parseStringArray,
  publicProperty,
  publicUser,
} from "../middleware/validation.js";

test("parseStringArray accepts JSON arrays and comma-separated form values", () => {
  assert.deepEqual(parseStringArray('["Parking","Garden"]', "amenities"), [
    "Parking",
    "Garden",
  ]);
  assert.deepEqual(parseStringArray("Parking, Garden", "amenities"), [
    "Parking",
    "Garden",
  ]);
  assert.deepEqual(parseStringArray(undefined, "amenities"), []);
});

test("parseStringArray rejects JSON values that are not arrays", () => {
  assert.throws(() => parseStringArray('{"amenity":"Parking"}', "amenities"));
});

test("parseOptionalNumber validates integer and decimal values", () => {
  assert.equal(parseOptionalNumber("120.5", "areaSize"), 120.5);
  assert.equal(parseOptionalNumber("2", "bathrooms", { integer: true }), 2);
  assert.throws(() =>
    parseOptionalNumber("2.5", "bathrooms", { integer: true }),
  );
  assert.throws(() => parseOptionalNumber("not a number", "price"));
});

test("publicUser omits the password hash", () => {
  const user = publicUser({
    id: "user-id",
    name: "Buyer",
    email: "buyer@example.test",
    role: "buyer",
    password_hash: "never-return-this",
    phone: null,
    address: null,
    profile_pic: null,
    status: "active",
  });

  assert.equal(user.id, "user-id");
  assert.equal(user.role, "buyer");
  assert.equal("password_hash" in user, false);
});

test("publicProperty translates PostgreSQL columns into frontend fields", () => {
  const property = publicProperty({
    id: "property-id",
    title: "House",
    description: "A home",
    price: "5000000.00",
    security_deposit: null,
    maintenance: "500.00",
    city: "Dire Dawa",
    area: "Kezira",
    pincode: "3000",
    property_type: "house",
    bhk: "3",
    bathrooms: 2,
    area_size: "120.00",
    furnishing: "unfurnished",
    amenities: ["Parking"],
    status: "sale",
    images: [],
    is_verified: false,
    views: 0,
    seller_id: "seller-id",
    seller_name: "Seller",
    seller_email: "seller@example.test",
    seller_phone: null,
    seller_profile_pic: null,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
  });

  assert.equal(property._id, "property-id");
  assert.equal(property.price, 5000000);
  assert.equal(property.locality, "Kezira");
  assert.equal(property.maintenance, 500);
  assert.equal(property.seller.email, "seller@example.test");
});
