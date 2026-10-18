CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "user_role" AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE "user_status" AS ENUM ('active', 'inactive');
CREATE TYPE "property_status" AS ENUM ('sale', 'rent', 'sold', 'rented', 'active', 'pending');
CREATE TYPE "contact_status" AS ENUM ('unread', 'read');

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "profile_pic" TEXT,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "properties" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "security_deposit" DECIMAL(15,2),
    "maintenance" DECIMAL(15,2),
    "city" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "bhk" TEXT,
    "bathrooms" INTEGER,
    "area_size" DECIMAL(12,2),
    "furnishing" TEXT,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "property_status" NOT NULL DEFAULT 'sale',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "seller_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "role" "user_role",
    "status" "contact_status" NOT NULL DEFAULT 'unread',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "properties_seller_id_idx" ON "properties"("seller_id");
CREATE INDEX "properties_status_created_at_idx" ON "properties"("status", "created_at" DESC);
CREATE INDEX "properties_city_idx" ON "properties"("city");
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at" DESC);

ALTER TABLE "properties"
ADD CONSTRAINT "properties_seller_id_fkey"
FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "properties"
ADD CONSTRAINT "properties_price_check" CHECK ("price" > 0),
ADD CONSTRAINT "properties_security_deposit_check" CHECK ("security_deposit" IS NULL OR "security_deposit" >= 0),
ADD CONSTRAINT "properties_maintenance_check" CHECK ("maintenance" IS NULL OR "maintenance" >= 0),
ADD CONSTRAINT "properties_bathrooms_check" CHECK ("bathrooms" IS NULL OR "bathrooms" >= 0),
ADD CONSTRAINT "properties_area_size_check" CHECK ("area_size" IS NULL OR "area_size" > 0),
ADD CONSTRAINT "properties_views_check" CHECK ("views" >= 0);
