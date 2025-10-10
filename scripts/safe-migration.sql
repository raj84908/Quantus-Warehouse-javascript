-- Safe Migration Script for Multi-Tenancy
-- This adds organizationId fields with a temporary default, then updates them

BEGIN;

-- Step 1: Create Organization and AuthUser tables
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#8B5A3C',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

CREATE TABLE "AuthUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthUser_email_key" ON "AuthUser"("email");
CREATE INDEX "AuthUser_organizationId_idx" ON "AuthUser"("organizationId");
CREATE INDEX "AuthUser_email_idx" ON "AuthUser"("email");

ALTER TABLE "AuthUser" ADD CONSTRAINT "AuthUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2: Create first organization (temporary ID for migration)
INSERT INTO "Organization" ("id", "name", "slug", "plan", "isActive", "updatedAt")
VALUES ('temp-org-id-001', 'First Customer', 'first-customer', 'FREE', true, CURRENT_TIMESTAMP);

-- Step 3: Add organizationId columns with default value (temporary)
ALTER TABLE "Product" ADD COLUMN "organizationId" TEXT DEFAULT 'temp-org-id-001';
ALTER TABLE "Order" ADD COLUMN "organizationId" TEXT DEFAULT 'temp-org-id-001';
ALTER TABLE "Category" ADD COLUMN "organizationId" TEXT DEFAULT 'temp-org-id-001';
ALTER TABLE "People" ADD COLUMN "organizationId" TEXT DEFAULT 'temp-org-id-001';
ALTER TABLE "Report" ADD COLUMN "organizationId" TEXT DEFAULT 'temp-org-id-001';
ALTER TABLE "invoice_settings" ADD COLUMN "organizationId" TEXT DEFAULT 'temp-org-id-001';
ALTER TABLE "ShopifyConnection" ADD COLUMN "organizationId" TEXT DEFAULT 'temp-org-id-001';

-- Step 4: Update all rows to use the organization ID
UPDATE "Product" SET "organizationId" = 'temp-org-id-001' WHERE "organizationId" IS NULL;
UPDATE "Order" SET "organizationId" = 'temp-org-id-001' WHERE "organizationId" IS NULL;
UPDATE "Category" SET "organizationId" = 'temp-org-id-001' WHERE "organizationId" IS NULL;
UPDATE "People" SET "organizationId" = 'temp-org-id-001' WHERE "organizationId" IS NULL;
UPDATE "Report" SET "organizationId" = 'temp-org-id-001' WHERE "organizationId" IS NULL;
UPDATE "invoice_settings" SET "organizationId" = 'temp-org-id-001' WHERE "organizationId" IS NULL;
UPDATE "ShopifyConnection" SET "organizationId" = 'temp-org-id-001' WHERE "organizationId" IS NULL;

-- Step 5: Remove default and make NOT NULL
ALTER TABLE "Product" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Order" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Category" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "Category" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "People" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "People" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Report" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "Report" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "invoice_settings" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "invoice_settings" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "ShopifyConnection" ALTER COLUMN "organizationId" DROP DEFAULT;
ALTER TABLE "ShopifyConnection" ALTER COLUMN "organizationId" SET NOT NULL;

-- Step 6: Drop old unique constraints and add new ones with organizationId
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_sku_key";
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_shopifyProductId_key";
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_shopifyVariantId_key";

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_orderId_key";
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_name_key";
ALTER TABLE "People" DROP CONSTRAINT IF EXISTS "People_email_key";
ALTER TABLE "invoice_settings" DROP CONSTRAINT IF EXISTS "invoice_settings_organizationId_key";
ALTER TABLE "ShopifyConnection" DROP CONSTRAINT IF EXISTS "ShopifyConnection_organizationId_key";

-- Step 7: Add foreign keys
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "People" ADD CONSTRAINT "People_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invoice_settings" ADD CONSTRAINT "invoice_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopifyConnection" ADD CONSTRAINT "ShopifyConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Add new unique constraints
CREATE UNIQUE INDEX "Product_sku_organizationId_key" ON "Product"("sku", "organizationId");
CREATE UNIQUE INDEX "Product_shopifyProductId_organizationId_key" ON "Product"("shopifyProductId", "organizationId") WHERE "shopifyProductId" IS NOT NULL;
CREATE UNIQUE INDEX "Product_shopifyVariantId_organizationId_key" ON "Product"("shopifyVariantId", "organizationId") WHERE "shopifyVariantId" IS NOT NULL;

CREATE UNIQUE INDEX "Order_orderId_organizationId_key" ON "Order"("orderId", "organizationId");
CREATE UNIQUE INDEX "Category_name_organizationId_key" ON "Category"("name", "organizationId");
CREATE UNIQUE INDEX "People_email_organizationId_key" ON "People"("email", "organizationId");
CREATE UNIQUE INDEX "invoice_settings_organizationId_key" ON "invoice_settings"("organizationId");
CREATE UNIQUE INDEX "ShopifyConnection_organizationId_key" ON "ShopifyConnection"("organizationId");

-- Step 9: Add indexes for performance
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX "Product_organizationId_categoryId_idx" ON "Product"("organizationId", "categoryId");
CREATE INDEX "Order_organizationId_idx" ON "Order"("organizationId");
CREATE INDEX "Order_organizationId_status_idx" ON "Order"("organizationId", "status");
CREATE INDEX "Category_organizationId_idx" ON "Category"("organizationId");
CREATE INDEX "People_organizationId_idx" ON "People"("organizationId");
CREATE INDEX "Report_organizationId_idx" ON "Report"("organizationId");
CREATE INDEX "invoice_settings_organizationId_idx" ON "invoice_settings"("organizationId");
CREATE INDEX "ShopifyConnection_organizationId_idx" ON "ShopifyConnection"("organizationId");

COMMIT;
