-- AlterTable
ALTER TABLE "public"."invoice_settings" ADD COLUMN     "paymentMethods" TEXT DEFAULT 'Bank Transfer: [Account Details]
PayPal: payment@company.com
Check: Make payable to Company Name';
