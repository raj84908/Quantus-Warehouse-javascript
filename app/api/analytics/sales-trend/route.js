import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30'
    const days = parseInt(timeRange, 10)

    try {
        const salesData = []

        const now = new Date()

        // Compute today at UTC midnight
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

        for (let i = days - 1; i >= 0; i--) {
            // Compute UTC start and end for the day i days ago
            const startUTC = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate() - i))
            const endUTC = new Date(Date.UTC(todayUTC.getUTCFullYear(), todayUTC.getUTCMonth(), todayUTC.getUTCDate() - i + 1))

            // Query orderItems where order createdAt >= startUTC and < endUTC (UTC range)
            const orderItems = await prisma.orderItem.findMany({
                where: {
                    order: {
                        createdAt: {
                            gte: startUTC,
                            lt: endUTC,
                        },
                    },
                },
                select: {
                    price: true,
                    quantity: true,
                },
            })

            const dayRevenue = orderItems.reduce((total, item) => total + item.price * item.quantity, 0)

            // Format date as local ISO date string for display - alternatively use startUTC.toISOString().split('T')[0]
            const displayDate = startUTC.toISOString().split('T')[0]

            salesData.push({
                date: displayDate,
                revenue: dayRevenue,
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
