/*
  Warnings:

  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Product` table without a default value. This is not possible if the table is not empty.
*/

-- CreateCategoryTable
CREATE TABLE "Category" (
                            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                            "name" TEXT NOT NULL,
                            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                            "updatedAt" DATETIME NOT NULL
);

-- RedefineProductTable
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Create new Product table with categoryId foreign key
CREATE TABLE "new_Product" (
                               "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                               "sku" TEXT NOT NULL,
                               "name" TEXT NOT NULL,
                               "categoryId" INTEGER NOT NULL,
                               "stock" INTEGER NOT NULL,
                               "minStock" INTEGER NOT NULL,
                               "location" TEXT NOT NULL,
                               "value" REAL NOT NULL,
                               "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
                               "lastUpdated" DATETIME NOT NULL,
                               "image" TEXT,
                               CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Migrate data from Product to new_Product
INSERT INTO "new_Product" ("id", "image", "lastUpdated", "location", "minStock", "name", "sku", "status", "stock", "value")
SELECT "id", "image", "lastUpdated", "location", "minStock", "name", "sku", "status", "stock", "value" FROM "Product";

-- Drop Old Product table
DROP TABLE "Product";

-- Rename new_Product to Product
ALTER TABLE "new_Product" RENAME TO "Product";

-- Create Unique Index on Product's SKU
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- Create Category Name Unique Index
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- Re-enable Foreign Keys
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
