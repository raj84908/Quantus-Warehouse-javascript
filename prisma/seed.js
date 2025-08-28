// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const initialProducts = [
        {
            sku: 'WPA-002',
            name: 'Widget Pro A',
            category: 'Electronics',
            stock: 847,
            minStock: 100,
            location: 'A1-B2',
            value: 25.99,
            status: 'IN_STOCK'
        },
        {
            sku: 'PK-150',
            name: 'Premium Kit',
            category: 'Kits',
            stock: 12,
            minStock: 25,
            location: 'C2-D4',
            value: 89.99,
            status: 'LOW_STOCK'
        },
        {
            sku: 'WB-300',
            name: 'Widget Basic',
            category: 'Electronics',
            stock: 0,
            minStock: 75,
            location: 'A2-B1',
            value: 15.99,
            status: 'OUT_OF_STOCK'
        },
    ];

    for (const product of initialProducts) {
        await prisma.product.upsert({
            where: { sku: product.sku }, // check by SKU
            update: {},                  // do nothing if it exists
            create: product              // create if it doesn't exist
        });
    }

    console.log('✅ Seed completed without deleting user products!');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
