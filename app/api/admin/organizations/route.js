import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Force dynamic rendering since we use request headers
export const dynamic = 'force-dynamic'

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

// GET all organizations
export async function GET(request) {
  try {
    verifyAdmin(request)

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            lastLoginAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ organizations })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch organizations' },
      { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 }
    )
  }
}
