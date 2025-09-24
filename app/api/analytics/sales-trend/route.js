import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET sales trend data for charts
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30'
    const days = parseInt(timeRange)

    try {
        const salesData = []

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            date.setHours(0, 0, 0, 0) // Start of day

            const nextDate = new Date(date)
            nextDate.setDate(nextDate.getDate() + 1)

            const dayRevenue = await prisma.order.aggregate({
                where: {
                    createdAt: {
                        gte: date,
                        lt: nextDate
                    }
                },
                _sum: {
                    total: true
                }
            })

            salesData.push({
                date: date.toISOString().split('T')[0],
                revenue: dayRevenue._sum.total || 0
            })
        }

        return NextResponse.json(salesData)
    } catch (error) {
        console.error('Error fetching sales trend:', error)
        return NextResponse.json(
            { error: 'Failed to fetch sales trend' },
            { status: 500 }
        )
    }
}