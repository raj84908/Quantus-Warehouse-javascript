import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { checkRateLimit, sanitizeObject } from '@/lib/validation'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    // SECURITY: Rate limiting for admin login (5 attempts per IP per 15 minutes)
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
    const rateLimit = checkRateLimit(`admin-login:${clientIp}`, 5, 900000)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateLimit.resetIn} seconds.` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const sanitized = sanitizeObject(body)
    const { email, password } = sanitized

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find super admin
    const admin = await prisma.superAdmin.findUnique({
      where: { email }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        name: admin.name
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
