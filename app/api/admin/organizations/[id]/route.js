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

// DELETE organization
export async function DELETE(request, { params }) {
  try {
    verifyAdmin(request)

    const { id } = params

    // Delete organization (cascade will delete all related data)
    await prisma.organization.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Organization deleted' })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete organization' },
      { status: error.message === 'Unauthorized' || error.message === 'Invalid token' ? 401 : 500 }
    )
  }
}
