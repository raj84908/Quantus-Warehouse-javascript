import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// GET - fetch stock adjustments (filtered by organization)
export const GET = withAuth(async (request, { user }) => {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit')) || 5

        const stockAdjustments = await prisma.stockAdjustment.findMany({
            where: {
                product: {
                    organizationId: user.organizationId
                }
            },
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
})

// POST - create stock adjustment
export const POST = withAuth(async (request, { user }) => {
    try {
        const data = await request.json()
        const { productId, quantity, reason, notes, adjustedBy } = data

        // Get current product (verify it belongs to this organization)
        const product = await prisma.product.findFirst({
            where: {
                id: productId,
                organizationId: user.organizationId
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            )
        }

        // Calculate new stock
        const newStock = Math.max(0, product.stock + quantity)

        // Create stock adjustment record
        const adjustment = await prisma.stockAdjustment.create({
            data: {
                productId,
                quantity,
                previousStock: product.stock,
                newStock,
                reason,
                notes: notes || '',
                adjustedBy: adjustedBy || 'System'
            }
        })

        // Update product stock and status
        await prisma.product.update({
            where: { id: productId },
            data: {
                stock: newStock,
                status: newStock <= 0 ? 'OUT_OF_STOCK' :
                    newStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK'
            }
        })

        return NextResponse.json(adjustment, { status: 201 })
    } catch (error) {
        console.error('Error creating stock adjustment:', error)
        return NextResponse.json(
            { error: 'Failed to create stock adjustment' },
            { status: 500 }
        )
    }
})