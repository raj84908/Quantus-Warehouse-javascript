/**
 * Step 1: Create Organization and Auth tables
 * Run this FIRST
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Step 1: Creating Organization and AuthUser tables...\n')

  try {
    // Create tables manually
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Organization" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "plan" TEXT NOT NULL DEFAULT 'FREE',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "logo" TEXT,
        "primaryColor" TEXT NOT NULL DEFAULT '#8B5A3C',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
      )
    `)

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug")
    `)

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuthUser" (
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuthUser_pkey" PRIMARY KEY ("id")
      )
    `)

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AuthUser_email_key" ON "AuthUser"("email")
    `)

    console.log('✅ Tables created\n')

    // Generate a unique ID
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Insert organization
    await prisma.$executeRawUnsafe(`
      INSERT INTO "Organization" ("id", "name", "slug", "plan", "isActive", "updatedAt")
      VALUES ('${orgId}', 'First Customer', 'first-customer', 'FREE', true, CURRENT_TIMESTAMP)
    `)

    console.log('✅ Organization created')
    console.log('   ID:', orgId)
    console.log('   Name: First Customer')
    console.log('')

    // Create user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await prisma.$executeRawUnsafe(`
      INSERT INTO "AuthUser" ("id", "email", "password", "name", "organizationId", "role", "emailVerified", "updatedAt")
      VALUES ('${userId}', 'admin@firstcustomer.com', '${hashedPassword}', 'Admin User', '${orgId}', 'OWNER', true, CURRENT_TIMESTAMP)
    `)

    console.log('✅ Admin user created')
    console.log('   Email: admin@firstcustomer.com')
    console.log('   Password: admin123')
    console.log('')

    // Update all existing records
    console.log('📝 Updating existing data...')

    await prisma.$executeRawUnsafe(`UPDATE "Product" SET "organizationId" = '${orgId}' WHERE "organizationId" = 'temp'`)
    await prisma.$executeRawUnsafe(`UPDATE "Order" SET "organizationId" = '${orgId}' WHERE "organizationId" = 'temp'`)
    await prisma.$executeRawUnsafe(`UPDATE "Category" SET "organizationId" = '${orgId}' WHERE "organizationId" = 'temp'`)
    await prisma.$executeRawUnsafe(`UPDATE "People" SET "organizationId" = '${orgId}' WHERE "organizationId" = 'temp'`)
    await prisma.$executeRawUnsafe(`UPDATE "Report" SET "organizationId" = '${orgId}' WHERE "organizationId" = 'temp'`)
    await prisma.$executeRawUnsafe(`UPDATE "invoice_settings" SET "organizationId" = '${orgId}' WHERE "organizationId" = 'temp'`)
    await prisma.$executeRawUnsafe(`UPDATE "ShopifyConnection" SET "organizationId" = '${orgId}' WHERE "organizationId" = 'temp'`)

    console.log('✅ All data updated to organization')
    console.log('')

    console.log('🎉 Step 1 Complete!')
    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 NEXT STEP:')
    console.log('   Run: npx prisma db push')
    console.log('')
    console.log('   This will add foreign keys and indexes.')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')
    console.log('Save this organization ID:', orgId)

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\nIf Organization table already exists, that\'s OK!')
    console.log('You can skip to: npx prisma db push')
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
