CREATE TYPE "auth_code_purpose" AS ENUM ('email_verification', 'password_reset');

ALTER TABLE "users"
ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "auth_codes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "auth_code_purpose" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_codes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "auth_codes_attempts_check" CHECK ("attempts" >= 0)
);

CREATE UNIQUE INDEX "auth_codes_user_id_purpose_key" ON "auth_codes"("user_id", "purpose");
CREATE INDEX "auth_codes_expires_at_idx" ON "auth_codes"("expires_at");

ALTER TABLE "auth_codes"
ADD CONSTRAINT "auth_codes_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
