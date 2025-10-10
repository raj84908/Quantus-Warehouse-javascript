/**
 * Setup script for your first customer
 * This creates an organization and admin user for your existing free customer
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Setting up first customer...\n')

  // Create Organization for your first (free) customer
  const org = await prisma.organization.create({
    data: {
      name: "First Customer", // You can change this
      slug: "first-customer",
      plan: "FREE",
      isActive: true
    }
  })

  console.log('✅ Organization created:', org.name)
  console.log('   ID:', org.id)
  console.log('   Slug:', org.slug)
  console.log('')

  // Create admin user for this organization
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const user = await prisma.authUser.create({
    data: {
      email: "admin@firstcustomer.com", // Change this to their email
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
  console.log('   Role:', user.role)
  console.log('')

  console.log('⚠️  IMPORTANT: Change the password after first login!')
  console.log('')

  // Now migrate existing data to this organization
  console.log('📦 Migrating existing data to organization...\n')

  const [productsUpdated, ordersUpdated, categoriesUpdated, peopleUpdated, reportsUpdated] = await Promise.all([
    prisma.product.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
    prisma.order.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
    prisma.category.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
    prisma.people.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    }),
    prisma.report.updateMany({
      where: { organizationId: null },
      data: { organizationId: org.id }
    })
  ])

  console.log(`✅ Migrated ${productsUpdated.count} products`)
  console.log(`✅ Migrated ${ordersUpdated.count} orders`)
  console.log(`✅ Migrated ${categoriesUpdated.count} categories`)
  console.log(`✅ Migrated ${peopleUpdated.count} people`)
  console.log(`✅ Migrated ${reportsUpdated.count} reports`)
  console.log('')

  // Migrate Shopify connection if exists
  const shopifyConn = await prisma.shopifyConnection.findFirst()
  if (shopifyConn) {
    await prisma.shopifyConnection.update({
      where: { id: shopifyConn.id },
      data: { organizationId: org.id }
    })
    console.log('✅ Migrated Shopify connection')
  }

  // Migrate invoice settings if exists
  const invoiceSettings = await prisma.invoiceSettings.findFirst()
  if (invoiceSettings) {
    await prisma.invoiceSettings.update({
      where: { id: invoiceSettings.id },
      data: { organizationId: org.id }
    })
    console.log('✅ Migrated invoice settings')
  }

  console.log('')
  console.log('🎉 Setup complete!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('   1. Login with: admin@firstcustomer.com / admin123')
  console.log('   2. Change the password immediately')
  console.log('   3. Update user email to actual customer email')
  console.log('')
  console.log('Organization ID:', org.id)
  console.log('Save this ID - you\'ll need it for future customers!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
