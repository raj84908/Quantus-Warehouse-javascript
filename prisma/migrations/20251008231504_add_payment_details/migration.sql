-- AlterTable
ALTER TABLE "public"."PartialPayment" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paymentMethod" TEXT DEFAULT 'Cash';
