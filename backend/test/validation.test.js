import test from "node:test";
import assert from "node:assert/strict";
import {
  parseOptionalNumber,
  parseStringArray,
  publicProperty,
  publicUser,
} from "../middleware/validation.js";
import {
  authCodeMatches,
  generateAuthCode,
  hashAuthCode,
  passwordPolicyError,
} from "../utils/authSecurity.js";

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
    passwordHash: "never-return-this",
    phone: null,
    address: null,
    profilePic: null,
    status: "active",
    emailVerified: true,
  });

  assert.equal(user.id, "user-id");
  assert.equal(user.role, "buyer");
  assert.equal("passwordHash" in user, false);
  assert.equal(user.emailVerified, true);
});

test("passwordPolicyError accepts strong passwords and rejects weak or oversized values", () => {
  assert.equal(passwordPolicyError("Strong-Password-987!"), null);
  assert.match(passwordPolicyError("short"), /12 characters/);
  assert.match(passwordPolicyError("alllowercase123!"), /uppercase and lowercase/);
  assert.match(passwordPolicyError(`Aa1!${"x".repeat(70)}`), /72 UTF-8 bytes/);
});

test("authentication code digests are purpose-bound and verify without storing plaintext", () => {
  const testSecret = "test-only-secret-for-auth-code-unit-tests-123456";
  const hash = hashAuthCode("user-id", "email_verification", "004201", testSecret);
  assert.equal(hash.length, 64);
  assert.equal(authCodeMatches(hash, "user-id", "email_verification", "004201", testSecret), true);
  assert.equal(authCodeMatches(hash, "user-id", "password_reset", "004201", testSecret), false);
  assert.equal(authCodeMatches(hash, "another-user", "email_verification", "004201", testSecret), false);
});

test("generated authentication codes are six digits", () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    assert.match(generateAuthCode(), /^\d{6}$/);
  }
});

test("publicProperty translates PostgreSQL columns into frontend fields", () => {
  const property = publicProperty({
    id: "property-id",
    title: "House",
    description: "A home",
    price: "5000000.00",
    securityDeposit: null,
    maintenance: "500.00",
    city: "Dire Dawa",
    area: "Kezira",
    pincode: "3000",
    propertyType: "house",
    bhk: "3",
    bathrooms: 2,
    areaSize: "120.00",
    furnishing: "unfurnished",
    amenities: ["Parking"],
    status: "sale",
    images: [],
    isVerified: false,
    views: 0,
    sellerId: "seller-id",
    seller: {
      id: "seller-id",
      name: "Seller",
      email: "seller@example.test",
      phone: null,
      profilePic: null,
    },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  });

  assert.equal(property._id, "property-id");
  assert.equal(property.price, 5000000);
  assert.equal(property.locality, "Kezira");
  assert.equal(property.maintenance, 500);
  assert.equal(property.seller.email, "seller@example.test");
});
