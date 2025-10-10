const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function updatePassword() {
  try {
    console.log('\n🔐 Update User Password\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Get user email
    const email = await question('Enter user email: ')

    // Find user
    const user = await prisma.authUser.findUnique({
      where: { email },
      include: { organization: true }
    })

    if (!user) {
      console.log('\n❌ Error: User not found with email:', email)
      process.exit(1)
    }

    console.log('\n✓ User found:')
    console.log(`  Name: ${user.name}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Organization: ${user.organization.name}`)
    console.log(`  Role: ${user.role}\n`)

    // Get new password
    const newPassword = await question('Enter new password (min 8 characters): ')

    if (newPassword.length < 8) {
      console.log('\n❌ Error: Password must be at least 8 characters')
      process.exit(1)
    }

    // Confirm password
    const confirmPassword = await question('Confirm new password: ')

    if (newPassword !== confirmPassword) {
      console.log('\n❌ Error: Passwords do not match')
      process.exit(1)
    }

    // Hash the new password
    console.log('\n⏳ Hashing password...')
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update in database
    console.log('⏳ Updating database...')
    await prisma.authUser.update({
      where: { email },
      data: { password: hashedPassword }
    })

    console.log('\n✅ Password updated successfully!')
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✓ User can now login with:')
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${newPassword}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('\n❌ Error updating password:', error.message)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

updatePassword()
