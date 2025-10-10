import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Verify admin token
function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized')
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET)
    return decoded
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// GET all access keys
export async function GET(request) {
  try {
    const admin = verifyAdmin(request)

    const keys = await prisma.accessKey.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Error fetching access keys:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch access keys' },
      { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 }
    )
  }
}

// POST create new access key
export async function POST(request) {
  try {
    const admin = verifyAdmin(request)
    const body = await request.json()

    const { maxUses, expiresAt, notes } = body

    // Generate unique key
    const key = `QW-${crypto.randomBytes(8).toString('hex').toUpperCase()}`

    const accessKey = await prisma.accessKey.create({
      data: {
        key,
        isActive: true,
        maxUses: maxUses || null,
        currentUses: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: admin.email,
        notes: notes || 'Generated from admin panel'
      }
    })

    return NextResponse.json({ success: true, key: accessKey })
  } catch (error) {
    console.error('Error creating access key:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create access key' },
      { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 }
    )
  }
}
