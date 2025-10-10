import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

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

// POST toggle suspension
export async function POST(request, { params }) {
  try {
    verifyAdmin(request)

    const { id } = params

    // Get current org
    const org = await prisma.organization.findUnique({
      where: { id }
    })

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Toggle suspension
    const updated = await prisma.organization.update({
      where: { id },
      data: {
        isSuspended: !org.isSuspended
      }
    })

    return NextResponse.json({
      success: true,
      isSuspended: updated.isSuspended
    })
  } catch (error) {
    console.error('Error toggling suspension:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle suspension' },
      { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 }
    )
  }
}
