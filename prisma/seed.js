// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const initialProducts = [
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
