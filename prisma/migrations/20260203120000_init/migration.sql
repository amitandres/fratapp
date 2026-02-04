-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "role" AS ENUM ('member', 'admin');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('venmo', 'zelle', 'paypal');

-- CreateEnum
CREATE TYPE "category" AS ENUM ('food', 'drinks', 'hardware', 'lights', 'other');

-- CreateEnum
CREATE TYPE "status" AS ENUM ('submitted', 'approved', 'paid', 'rejected', 'needs_review');

-- CreateEnum
CREATE TYPE "paid_via" AS ENUM ('venmo', 'zelle', 'paypal', 'cash');

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "code" TEXT NOT NULL,
    "org_id" UUID NOT NULL,
    "role" "role" NOT NULL,
    "max_uses" INTEGER NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "payment_method" "payment_method" NOT NULL,
    "payment_handle" TEXT,
    "role" "role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL,
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "category" "category" NOT NULL,
    "status" "status" NOT NULL DEFAULT 'submitted',
    "photo_key" TEXT NOT NULL,
    "ai_extracted_total_cents" INTEGER,
    "ai_match" BOOLEAN,
    "paid_at" TIMESTAMP(3),
    "paid_via" "paid_via",
    "paid_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_edits" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "editor_user_id" UUID NOT NULL,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_edits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "org_id" UUID,
    "type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invite_codes_org_id_idx" ON "invite_codes"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_org_id_idx" ON "profiles"("org_id");

-- CreateIndex
CREATE INDEX "receipts_org_id_idx" ON "receipts"("org_id");

-- CreateIndex
CREATE INDEX "receipts_user_id_idx" ON "receipts"("user_id");

-- CreateIndex
CREATE INDEX "receipts_status_idx" ON "receipts"("status");

-- CreateIndex
CREATE INDEX "receipts_created_at_idx" ON "receipts"("created_at");

-- CreateIndex
CREATE INDEX "receipt_edits_receipt_id_idx" ON "receipt_edits"("receipt_id");

-- CreateIndex
CREATE INDEX "receipt_edits_editor_user_id_idx" ON "receipt_edits"("editor_user_id");

-- CreateIndex
CREATE INDEX "jobs_org_id_idx" ON "jobs"("org_id");

-- CreateIndex
CREATE INDEX "jobs_type_idx" ON "jobs"("type");

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_edits" ADD CONSTRAINT "receipt_edits_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_edits" ADD CONSTRAINT "receipt_edits_editor_user_id_fkey" FOREIGN KEY ("editor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

