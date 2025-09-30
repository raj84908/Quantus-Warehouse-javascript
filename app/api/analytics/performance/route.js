import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// GET performance metrics
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30'
    const days = parseInt(timeRange)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
        // Calculate average order fulfillment time (Processing to Completed)
        const completedOrders = await prisma.order.findMany({
            where: {
                status: 'Completed',
                createdAt: {
                    gte: startDate
                }
            },
            select: {
                createdAt: true,
                updatedAt: true
            }
        })

        const avgFulfillmentTime = completedOrders.length > 0
            ? completedOrders.reduce((sum, order) => {
            const diff = order.updatedAt.getTime() - order.createdAt.getTime()
            return sum + (diff / (1000 * 60 * 60 * 24)) // Convert to days
        }, 0) / completedOrders.length
            : 0

        // Inventory accuracy (products with correct stock status)
        const totalProducts = await prisma.product.count()
        const accurateProducts = await prisma.product.count({
            where: {
                OR: [
                    {
                        AND: [
                            { stock: { gt: 0 } },
                            { stock: { gt: prisma.product.fields.minStock } },
                            { status: 'IN_STOCK' }
                        ]
                    },
                    {
                        AND: [
                            { stock: { lte: prisma.product.fields.minStock } },
                            { stock: { gt: 0 } },
                            { status: 'LOW_STOCK' }
                        ]
                    },
                    {
                        AND: [
                            { stock: 0 },
                            { status: 'OUT_OF_STOCK' }
                        ]
                    }
                ]
            }
        })

        // Simplified inventory accuracy calculation
        const inStockProducts = await prisma.product.count({
            where: {
                stock: { gt: 0 }
            }
        })

        const inventoryAccuracy = totalProducts > 0 ? (inStockProducts / totalProducts) * 100 : 0

        // Order completion rate (completed orders vs total orders)
        const totalOrders = await prisma.order.count({
            where: {
                createdAt: {
                    gte: startDate
                }
            }
        })

        const completedOrdersCount = await prisma.order.count({
            where: {
                status: 'Completed',
                createdAt: {
                    gte: startDate
                }
            }
        })

        const orderCompletionRate = totalOrders > 0 ? (completedOrdersCount / totalOrders) * 100 : 0

        return NextResponse.json([
            {
                metric: "Order Fulfillment Time",
                value: `${avgFulfillmentTime.toFixed(1)} days`,
                target: "2.0 days"
            },
            {
                metric: "Inventory Accuracy",
                value: `${inventoryAccuracy.toFixed(1)}%`,
                target: "99.0%"
            },
            {
                metric: "Order Completion Rate",
                value: `${orderCompletionRate.toFixed(1)}%`,
                target: "98.0%"
            }
        ])
    } catch (error) {
        console.error('Error fetching performance metrics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch performance metrics' },
            { status: 500 }
        )
    }
}