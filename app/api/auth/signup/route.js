import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { signupSchema, validate, checkRateLimit, sanitizeObject } from '@/lib/validation'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const body = await request.json()

    // SECURITY: Rate limiting (10 signups per IP per hour)
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const rateLimit = checkRateLimit(`signup:${clientIp}`, 10, 3600000)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many signup attempts. Please try again in ${rateLimit.resetIn} seconds.` },
        { status: 429 }
      )
    }

    // SECURITY: Sanitize input to prevent XSS
    const sanitizedBody = sanitizeObject(body)
    const { name, email, password, organizationName, accessKey } = sanitizedBody

    // SECURITY: Validate input with Zod schema
    const validation = validate(signupSchema, sanitizedBody)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Validate access key
    const validKey = await prisma.accessKey.findUnique({
      where: { key: accessKey }
    })

    if (!validKey) {
      return NextResponse.json(
        { error: 'Invalid access key' },
        { status: 400 }
      )
    }

    if (!validKey.isActive) {
      return NextResponse.json(
        { error: 'This access key has been deactivated' },
        { status: 400 }
      )
    }

    if (validKey.expiresAt && new Date(validKey.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This access key has expired' },
        { status: 400 }
      )
    }

    if (validKey.maxUses && validKey.currentUses >= validKey.maxUses) {
      return NextResponse.json(
        { error: 'This access key has reached its usage limit' },
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
          plan: 'STANDARD', // Single plan only
          isActive: true,
          accessKeyUsed: accessKey
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

      // Increment access key usage
      await tx.accessKey.update({
        where: { key: accessKey },
        data: { currentUses: { increment: 1 } }
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
