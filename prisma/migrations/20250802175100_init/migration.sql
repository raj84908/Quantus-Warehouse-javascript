-- CreateTable
CREATE TABLE "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "minStock" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "lastUpdated" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
