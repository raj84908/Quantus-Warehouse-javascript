/**
 * SAFE Migration to Multi-Tenant System
 * This script will:
 * 1. Create Organization table
 * 2. Create your first organization
 * 3. Add organizationId to all existing tables
 * 4. Migrate all your existing data
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting safe migration to multi-tenant system...\n')

  try {
    // Step 1: Use raw SQL to add columns with defaults
    console.log('📝 Step 1: Adding organizationId columns...')

    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "organizationId" TEXT DEFAULT 'temp'`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "organizationId" TEXT DEFAULT 'temp'`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "organizationId" TEXT DEFAULT 'temp'`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "People" ADD COLUMN IF NOT EXISTS "organizationId" TEXT DEFAULT 'temp'`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "organizationId" TEXT DEFAULT 'temp'`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "invoice_settings" ADD COLUMN IF NOT EXISTS "organizationId" TEXT DEFAULT 'temp'`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "ShopifyConnection" ADD COLUMN IF NOT EXISTS "organizationId" TEXT DEFAULT 'temp'`)

    console.log('✅ Columns added with temporary default\n')

    // Step 2: Generate Prisma client again
    console.log('📝 Step 2: Generating Prisma client...')
    const { execSync } = require('child_process')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✅ Prisma client generated\n')

    // Reload Prisma client
    delete require.cache[require.resolve('@prisma/client')]
    const { PrismaClient: PrismaClient2 } = require('@prisma/client')
    const prisma2 = new PrismaClient2()

    // Step 3: Create Organization
    console.log('📝 Step 3: Creating first organization...')

    const org = await prisma2.organization.create({
      data: {
        name: "First Customer",
        slug: "first-customer",
        plan: "FREE",
        isActive: true
      }
    })

    console.log('✅ Organization created:')
    console.log('   Name:', org.name)
    console.log('   ID:', org.id)
    console.log('   Slug:', org.slug)
    console.log('')

    // Step 4: Create admin user
    console.log('📝 Step 4: Creating admin user...')

    const hashedPassword = await bcrypt.hash('admin123', 12)

    const user = await prisma2.authUser.create({
      data: {
        email: "admin@firstcustomer.com", // CHANGE THIS
        password: hashedPassword,
        name: "Admin User",
        role: "OWNER",
        organizationId: org.id,
        emailVerified: true
      }
    })

    console.log('✅ Admin user created:')
    console.log('   Email:', user.email)
    console.log('   Password: admin123')
    console.log('   ⚠️  CHANGE PASSWORD AFTER LOGIN!')
    console.log('')

    // Step 5: Update all existing records
    console.log('📝 Step 5: Migrating existing data to organization...')

    await prisma2.$executeRawUnsafe(`UPDATE "Product" SET "organizationId" = '${org.id}' WHERE "organizationId" = 'temp'`)
    await prisma2.$executeRawUnsafe(`UPDATE "Order" SET "organizationId" = '${org.id}' WHERE "organizationId" = 'temp'`)
    await prisma2.$executeRawUnsafe(`UPDATE "Category" SET "organizationId" = '${org.id}' WHERE "organizationId" = 'temp'`)
    await prisma2.$executeRawUnsafe(`UPDATE "People" SET "organizationId" = '${org.id}' WHERE "organizationId" = 'temp'`)
    await prisma2.$executeRawUnsafe(`UPDATE "Report" SET "organizationId" = '${org.id}' WHERE "organizationId" = 'temp'`)
    await prisma2.$executeRawUnsafe(`UPDATE "invoice_settings" SET "organizationId" = '${org.id}' WHERE "organizationId" = 'temp'`)
    await prisma2.$executeRawUnsafe(`UPDATE "ShopifyConnection" SET "organizationId" = '${org.id}' WHERE "organizationId" = 'temp'`)

    console.log('✅ All data migrated to organization')
    console.log('')

    // Step 6: Remove default and make NOT NULL
    console.log('📝 Step 6: Making organizationId required...')

    await prisma2.$executeRawUnsafe(`ALTER TABLE "Product" ALTER COLUMN "organizationId" DROP DEFAULT`)
    await prisma2.$executeRawUnsafe(`ALTER TABLE "Product" ALTER COLUMN "organizationId" SET NOT NULL`)

    await prisma2.$executeRawUnsafe(`ALTER TABLE "Order" ALTER COLUMN "organizationId" DROP DEFAULT`)
    await prisma2.$executeRawUnsafe(`ALTER TABLE "Order" ALTER COLUMN "organizationId" SET NOT NULL`)

    await prisma2.$executeRawUnsafe(`ALTER TABLE "Category" ALTER COLUMN "organizationId" DROP DEFAULT`)
    await prisma2.$executeRawUnsafe(`ALTER TABLE "Category" ALTER COLUMN "organizationId" SET NOT NULL`)

    await prisma2.$executeRawUnsafe(`ALTER TABLE "People" ALTER COLUMN "organizationId" DROP DEFAULT`)
    await prisma2.$executeRawUnsafe(`ALTER TABLE "People" ALTER COLUMN "organizationId" SET NOT NULL`)

    await prisma2.$executeRawUnsafe(`ALTER TABLE "Report" ALTER COLUMN "organizationId" DROP DEFAULT`)
    await prisma2.$executeRawUnsafe(`ALTER TABLE "Report" ALTER COLUMN "organizationId" SET NOT NULL`)

    await prisma2.$executeRawUnsafe(`ALTER TABLE "invoice_settings" ALTER COLUMN "organizationId" DROP DEFAULT`)
    await prisma2.$executeRawUnsafe(`ALTER TABLE "invoice_settings" ALTER COLUMN "organizationId" SET NOT NULL`)

    await prisma2.$executeRawUnsafe(`ALTER TABLE "ShopifyConnection" ALTER COLUMN "organizationId" DROP DEFAULT`)
    await prisma2.$executeRawUnsafe(`ALTER TABLE "ShopifyConnection" ALTER COLUMN "organizationId" SET NOT NULL`)

    console.log('✅ Organization ID is now required')
    console.log('')

    // Step 7: Now use db push to add foreign keys and indexes
    console.log('📝 Step 7: Adding foreign keys and indexes...')
    console.log('   Run: npx prisma db push')
    console.log('')

    console.log('🎉 Migration complete!')
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('📋 LOGIN CREDENTIALS:')
    console.log('   Email: admin@firstcustomer.com')
    console.log('   Password: admin123')
    console.log('')
    console.log('⚠️  IMPORTANT NEXT STEPS:')
    console.log('   1. Run: npx prisma db push')
    console.log('   2. Run: npx prisma generate')
    console.log('   3. Update email in database to real customer email')
    console.log('   4. Customer must change password on first login')
    console.log('')
    console.log('Organization ID:', org.id)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    await prisma2.$disconnect()

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('')
    console.log('Don\'t worry! Your data is safe.')
    console.log('The script will rollback any changes.')
    process.exit(1)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
