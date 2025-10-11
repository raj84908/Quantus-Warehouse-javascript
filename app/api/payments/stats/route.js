import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '365'

    // Calculate date threshold
    const dateThreshold = new Date()
    if (timeRange !== 'all') {
      dateThreshold.setDate(dateThreshold.getDate() - parseInt(timeRange))
    } else {
      dateThreshold.setFullYear(2000) // All time
    }

    // Get all orders with their payment information
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: dateThreshold
        }
      },
      include: {
        items: true
      }
    })

    // Calculate statistics
    let unpaid = 0
    let partial = 0
    let paid = 0
    let partialCount = 0

    orders.forEach(order => {
      const total = parseFloat(order.total) || 0
      const paidAmount = parseFloat(order.amountPaid) || 0
      const balance = total - paidAmount

      if (balance <= 0) {
        paid += total
      } else if (paidAmount > 0) {
        partial += balance
        partialCount++
      } else {
        unpaid += total
      }
    })

    const total = unpaid + partial + paid

    return NextResponse.json({
      unpaid,
      partial,
      paid,
      total,
      partialCount
    })
  } catch (error) {
    console.error('Error fetching payment stats:', error)
    return NextResponse.json({ error: 'Failed to fetch payment statistics' }, { status: 500 })
  }
}
