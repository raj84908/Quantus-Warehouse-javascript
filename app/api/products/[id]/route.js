import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/[id]
export async function GET(request, { params }) {
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(params.id) },
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
}

// PUT /api/products/[id]
export async function PUT(request, { params }) {
    try {
        const data = await request.json()

        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(params.id) },
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
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }
}

// DELETE /api/products/[id]
export async function DELETE(request, { params }) {
    try {
        await prisma.product.delete({
            where: { id: parseInt(params.id) }
        })

        return NextResponse.json({ message: 'Product deleted successfully' })
    } catch (error) {
        console.error('Error deleting product:', error)
        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }
}