import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// GET /api/products/[id]
export const GET = withAuth(async (request, { params, user }) => {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
        }

        const product = await prisma.product.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            },
            include: {
                category: true,
                stockAdjustments: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        return NextResponse.json(product)
    } catch (error) {
        console.error('Error fetching product:', error)
        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
    }
})

// PUT /api/products/[id]
export const PUT = withAuth(async (request, { params, user }) => {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
        }

        const data = await request.json()

        // Verify product belongs to user's organization
        const existingProduct = await prisma.product.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!existingProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        // If categoryId is being changed, verify it belongs to the organization
        if (data.categoryId) {
            const category = await prisma.category.findFirst({
                where: {
                    id: data.categoryId,
                    organizationId: user.organizationId
                }
            })

            if (!category) {
                return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
            }
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                categoryId: data.categoryId,
                stock: data.stock,
                minStock: data.minStock,
                location: data.location,
                value: data.value,
                status: data.status,
                image: data.image
            },
            include: {
                category: true
            }
        })

        return NextResponse.json(updatedProduct)
    } catch (error) {
        console.error('Error updating product:', error)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
})

// DELETE /api/products/[id]
export const DELETE = withAuth(async (request, { params, user }) => {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
        }

        // Verify product belongs to user's organization
        const product = await prisma.product.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }

        await prisma.product.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error('Error deleting product:', error)
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
})