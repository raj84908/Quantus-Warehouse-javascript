-- CreateTable
CREATE TABLE "public"."invoice_settings" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'Your Company',
    "companyEmail" TEXT,
    "companyPhone" TEXT,
    "companyAddress" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#8B5A3C',
    "secondaryColor" TEXT NOT NULL DEFAULT '#F5F5F5',
    "textColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_settings_pkey" PRIMARY KEY ("id")
);
