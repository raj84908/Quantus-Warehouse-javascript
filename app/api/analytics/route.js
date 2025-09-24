import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET analytics data
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30'
    const days = parseInt(timeRange)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
        // Revenue calculation from orders
        const revenueData = await prisma.order.aggregate({
            where: {
                createdAt: {
                    gte: startDate
                }
            },
            _sum: {
                total: true
            }
        })

        // Previous period revenue for comparison
        const previousStartDate = new Date()
        previousStartDate.setDate(previousStartDate.getDate() - (days * 2))
        const previousEndDate = new Date()
        previousEndDate.setDate(previousEndDate.getDate() - days)

        const previousRevenueData = await prisma.order.aggregate({
            where: {
                createdAt: {
                    gte: previousStartDate,
                    lt: previousEndDate
                }
            },
            _sum: {
                total: true
            }
        })

        // Orders processed count
        const ordersCount = await prisma.order.count({
            where: {
                createdAt: {
                    gte: startDate
                }
            }
        })

        const previousOrdersCount = await prisma.order.count({
            where: {
                createdAt: {
                    gte: previousStartDate,
                    lt: previousEndDate
                }
            }
        })

        // Stock adjustments for inventory activity
        const stockAdjustments = await prisma.stockAdjustment.count({
            where: {
                createdAt: {
                    gte: startDate
                }
            }
        })

        const previousStockAdjustments = await prisma.stockAdjustment.count({
            where: {
                createdAt: {
                    gte: previousStartDate,
                    lt: previousEndDate
                }
            }
        })

        // Calculate customer satisfaction (based on completed vs total orders)
        const completedOrders = await prisma.order.count({
            where: {
                status: 'Completed',
                createdAt: {
                    gte: startDate
                }
            }
        })

        const customerSatisfaction = ordersCount > 0 ? (completedOrders / ordersCount) * 100 : 0

        // Previous period satisfaction
        const previousCompletedOrders = await prisma.order.count({
            where: {
                status: 'Completed',
                createdAt: {
                    gte: previousStartDate,
                    lt: previousEndDate
                }
            }
        })
        const previousSatisfaction = previousOrdersCount > 0 ? (previousCompletedOrders / previousOrdersCount) * 100 : 0

        // Calculate percentage changes
        const revenue = revenueData._sum.total || 0
        const previousRevenue = previousRevenueData._sum.total || 0
        const revenueChange = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0

        const ordersChange = previousOrdersCount > 0 ? ((ordersCount - previousOrdersCount) / previousOrdersCount) * 100 : 0
        const satisfactionChange = previousSatisfaction > 0 ? ((customerSatisfaction - previousSatisfaction) / previousSatisfaction) * 100 : 0

        // Inventory turnover calculation (adjustments per day)
        const inventoryTurnover = stockAdjustments / days
        const previousInventoryTurnover = previousStockAdjustments / days
        const inventoryChange = previousInventoryTurnover > 0 ? ((inventoryTurnover - previousInventoryTurnover) / previousInventoryTurnover) * 100 : 0

        return NextResponse.json({
            revenue: {
                value: revenue,
                change: revenueChange
            },
            orders: {
                value: ordersCount,
                change: ordersChange
            },
            inventoryTurnover: {
                value: inventoryTurnover,
                change: inventoryChange
            },
            customerSatisfaction: {
                value: customerSatisfaction,
                change: satisfactionChange
            }
        })
    } catch (error) {
        console.error('Error fetching analytics:', error)
        return NextResponse.json(
            { error: 'Failed to fetch analytics data' },
            { status: 500 }
        )
    }
}