import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Get revenue statistics for dashboard
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Calculate date ranges
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start of this week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get orders for today
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfToday
        }
      },
      select: {
        total: true
      }
    })

    // Get orders for this week
    const weekOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfWeek
        }
      },
      select: {
        total: true
      }
    })

    // Get orders for this month
    const monthOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      },
      select: {
        total: true
      }
    })

    // Calculate totals
    const today = todayOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)
    const week = weekOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)
    const month = monthOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0)

    return NextResponse.json({
      today,
      week,
      month
    })
  } catch (error) {
    console.error('Error fetching revenue stats:', error)
    return NextResponse.json({
      today: 0,
      week: 0,
      month: 0
    }, { status: 200 }) // Return zeros instead of error for graceful degradation
  }
}
