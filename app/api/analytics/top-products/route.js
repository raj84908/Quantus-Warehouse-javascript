import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// GET top products
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30'
    const days = parseInt(timeRange)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
        const topProducts = await prisma.orderItem.groupBy({
            by: ['sku', 'name'],
            where: {
                order: {
                    createdAt: {
                        gte: startDate
                    }
                }
            },
            _sum: {
                quantity: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 5
        })

        // Get previous period data for comparison
        const previousStartDate = new Date()
        previousStartDate.setDate(previousStartDate.getDate() - (days * 2))
        const previousEndDate = new Date()
        previousEndDate.setDate(previousEndDate.getDate() - days)

        const previousTopProducts = await prisma.orderItem.groupBy({
            by: ['sku'],
            where: {
                order: {
                    createdAt: {
                        gte: previousStartDate,
                        lt: previousEndDate
                    }
                }
            },
            _sum: {
                quantity: true
            }
        })

        // Calculate changes
        const productsWithChange = topProducts.map(product => {
            const previousProduct = previousTopProducts.find(p => p.sku === product.sku)
            const previousQuantity = previousProduct?._sum?.quantity || 0
            const currentQuantity = product._sum.quantity
            const change = previousQuantity > 0 ? ((currentQuantity - previousQuantity) / previousQuantity) * 100 : 100

            return {
                name: product.name,
                units: `${currentQuantity} units sold`,
                change: change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`
            }
        })

        return NextResponse.json(productsWithChange)
    } catch (error) {
        console.error('Error fetching top products:', error)
        return NextResponse.json(
            { error: 'Failed to fetch top products' },
            { status: 500 }
        )
    }
}