import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, email, password, organizationName, plan } = body

    // Validation
    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.authUser.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create organization slug from name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug exists, if so, append random string
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    })

    const finalSlug = existingOrg
      ? `${slug}-${Math.random().toString(36).substr(2, 6)}`
      : slug

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug: finalSlug,
          plan: plan || 'STARTER',
          isActive: true
        }
      })

      // Create user
      const user = await tx.authUser.create({
        data: {
          email,
          password: hashedPassword,
          name,
          organizationId: organization.id,
          role: 'OWNER',
          emailVerified: false
        }
      })

      return { organization, user }
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      organizationId: result.organization.id,
      userId: result.user.id
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
