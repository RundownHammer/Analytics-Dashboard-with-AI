/*
  Warnings:

  - You are about to drop the column `amount` on the `LineItem` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `LineItem` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,3)`.
  - You are about to drop the column `method` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subTotal` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `LineItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Vendor` table without a default value. This is not possible if the table is not empty.
  - Made the column `category` on table `Vendor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "LineItem" DROP CONSTRAINT "LineItem_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_invoiceId_fkey";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "address" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "documentType" TEXT,
ADD COLUMN     "originalFileName" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "subTotal" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "taxAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "LineItem" DROP COLUMN "amount",
ADD COLUMN     "buSchluessel" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sachkonto" TEXT,
ADD COLUMN     "srNo" INTEGER,
ADD COLUMN     "totalPrice" DECIMAL(12,2) NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "method",
ADD COLUMN     "accountName" TEXT,
ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bic" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "address" TEXT,
ADD COLUMN     "partyNumber" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "category" SET DEFAULT 'Uncategorized';

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Invoice_vendorId_idx" ON "Invoice"("vendorId");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_issueDate_idx" ON "Invoice"("issueDate");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "LineItem_invoiceId_idx" ON "LineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_paidDate_idx" ON "Payment"("paidDate");

-- CreateIndex
CREATE INDEX "Vendor_name_idx" ON "Vendor"("name");

-- CreateIndex
CREATE INDEX "Vendor_category_idx" ON "Vendor"("category");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
