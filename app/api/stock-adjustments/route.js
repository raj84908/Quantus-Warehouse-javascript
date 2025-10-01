import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

export async function GET(request) {
    try {
        // Parse limit query param
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit')) || 5

        // Fetch recent stock adjustments
        const stockAdjustments = await prisma.stockAdjustment.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                product: true
            }
        })

        return NextResponse.json(stockAdjustments)
    } catch (error) {
        console.error('Error fetching stock adjustments:', error)
        return NextResponse.json(
            { error: 'Failed to fetch stock adjustments' },
            { status: 500 }
        )
    }
}
