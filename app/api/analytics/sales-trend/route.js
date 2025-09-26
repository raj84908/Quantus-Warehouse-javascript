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

        // Use local dates instead of UTC to avoid timezone shifts
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        for (let i = days - 1; i >= 0; i--) {
            // Create local start and end dates
            const startLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
            const endLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i + 1)

            // Query orderItems where order createdAt >= startLocal and < endLocal
            const orderItems = await prisma.orderItem.findMany({
                where: {
                    order: {
                        createdAt: {
                            gte: startLocal,
                            lt: endLocal,
                        },
                    },
                },
                select: {
                    price: true,
                    quantity: true,
                },
            })
            

            // Format date consistently for local display
            const displayDate = startLocal.getFullYear() + '-' +
                String(startLocal.getMonth() + 1).padStart(2, '0') + '-' +
                String(startLocal.getDate()).padStart(2, '0')

            const dayRevenue = orderItems.reduce((total, item) => total + item.price * item.quantity, 0)
            
            if (dayRevenue > 0) {
                console.log('Order items for this day:', orderItems.map(item => ({
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                })))
            }
            
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

