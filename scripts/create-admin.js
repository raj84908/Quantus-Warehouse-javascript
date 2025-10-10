const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Creating Super Admin and Access Keys...\n')

  // Create Super Admin
  const adminEmail = 'admin@quantus.com'
  const adminPassword = 'Admin@123' // Change this in production!
  const adminName = 'Super Administrator'

  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.superAdmin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName
    }
  })

  console.log('✅ Super Admin Created:')
  console.log(`   Email: ${adminEmail}`)
  console.log(`   Password: ${adminPassword}`)
  console.log(`   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!\n`)

  // Create Access Keys
  const keys = []

  // Create 3 access keys
  for (let i = 1; i <= 3; i++) {
    const key = `QW-${crypto.randomBytes(8).toString('hex').toUpperCase()}`

    const accessKey = await prisma.accessKey.create({
      data: {
        key,
        isActive: true,
        maxUses: null, // Unlimited
        currentUses: 0,
        expiresAt: null,
        createdBy: admin.email,
        notes: `Access key #${i} - Unlimited uses`
      }
    })

    keys.push(accessKey)
  }

  console.log('✅ Access Keys Created:')
  keys.forEach((key, index) => {
    console.log(`   ${index + 1}. ${key.key}`)
  })

  console.log('\n📋 Summary:')
  console.log(`   - Super admin created: ${admin.email}`)
  console.log(`   - Access keys created: ${keys.length}`)
  console.log('\n🚀 Next Steps:')
  console.log('   1. Go to http://localhost:3000/admin/login')
  console.log(`   2. Login with ${adminEmail} / ${adminPassword}`)
  console.log('   3. Use one of the access keys above to create customer accounts')
  console.log('\n')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
