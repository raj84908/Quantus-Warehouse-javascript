import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// GET insights and alerts
export async function GET() {
    try {
        const insights = []

        // Low stock alerts
        const lowStockCount = await prisma.product.count({
            where: {
                OR: [
                    { status: 'LOW_STOCK' },
                    { status: 'OUT_OF_STOCK' }
                ]
            }
        })

        if (lowStockCount > 0) {
            insights.push({
                type: "Stock Alert",
                message: `Low stock detected for ${lowStockCount} items`,
                severity: "warning"
            })
        }

        // Recent stock adjustment activity
        const recentAdjustments = await prisma.stockAdjustment.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            }
        })

        if (recentAdjustments > 0) {
            insights.push({
                type: "Activity",
                message: `${recentAdjustments} stock adjustments made this week`,
                severity: "info"
            })
        }

        // Recent orders activity
        const recentOrders = await prisma.order.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            }
        })

        if (recentOrders > 0) {
            insights.push({
                type: "Performance",
                message: `${recentOrders} orders processed this week`,
                severity: "success"
            })
        }

        // Category performance - find top-selling category
        const categoryPerformance = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            },
            select: {
                name: true,
                quantity: true
            }
        })

        if (categoryPerformance.length > 0) {
            // Group by product name and sum quantities (simplified approach)
            const productSales = {}
            categoryPerformance.forEach(item => {
                if (productSales[item.name]) {
                    productSales[item.name] += item.quantity
                } else {
                    productSales[item.name] = item.quantity
                }
            })

            // Find top product
            const topProduct = Object.entries(productSales)
                .sort(([,a], [,b]) => b - a)[0]

            if (topProduct) {
                insights.push({
                    type: "Trend",
                    message: `${topProduct[0]} showing strong sales performance`,
                    severity: "success"
                })
            }
        }

        // High priority orders pending
        const highPriorityOrders = await prisma.order.count({
            where: {
                priority: 'High',
                status: 'Processing'
            }
        })

        if (highPriorityOrders > 0) {
            insights.push({
                type: "Priority Alert",
                message: `${highPriorityOrders} high-priority orders need attention`,
                severity: "warning"
            })
        }

        return NextResponse.json(insights)
    } catch (error) {
        console.error('Error fetching insights:', error)
        return NextResponse.json(
            { error: 'Failed to fetch insights' },
            { status: 500 }
        )
    }
}