import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

export const GET = withAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '365'

    // Calculate date threshold
    const dateThreshold = new Date()
    if (timeRange !== 'all') {
      dateThreshold.setDate(dateThreshold.getDate() - parseInt(timeRange))
    } else {
      dateThreshold.setFullYear(2000) // All time
    }

    // Get all orders with payment information - FILTERED BY ORGANIZATION
    const orders = await prisma.order.findMany({
      where: {
        organizationId: user.organizationId,
        createdAt: {
          gte: dateThreshold
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform orders into payment records
    const payments = orders.map(order => {
      const total = parseFloat(order.total) || 0
      const paidAmount = parseFloat(order.amountPaid) || 0
      const balance = total - paidAmount

      let status = 'Pending'
      if (balance <= 0) {
        status = 'Paid'
      } else if (paidAmount > 0) {
        status = 'Partial'
      } else {
        // Check if overdue
        const dueDate = new Date(order.createdAt)
        dueDate.setDate(dueDate.getDate() + 30) // Assume 30 day payment terms
        if (dueDate < new Date()) {
          status = 'Overdue'
        }
      }

      return {
        id: order.id,
        date: order.createdAt,
        orderId: order.orderId || `ORD-${order.id}`,
        customer: order.customerName || order.customer || order.customerEmail || 'Unknown Customer',
        email: order.customerEmail || order.email || '',
        dueDate: (() => {
          const due = new Date(order.createdAt)
          due.setDate(due.getDate() + 30)
          return due
        })(),
        total: total,
        paid: paidAmount,
        balance: balance,
        status: status,
        memo: order.notes || '',
        type: 'Invoice'
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments list:', error)
    return NextResponse.json({ error: 'Failed to fetch payments list' }, { status: 500 })
  }
})