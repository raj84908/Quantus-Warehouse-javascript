import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products - Get all products
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true
            },
            orderBy: {
                lastUpdated: 'desc'
            }
        })
        return NextResponse.json(products)
    } catch (error) {
        console.error('Error fetching products:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}

// POST /api/products - Create new product
export async function POST(request) {
    try {
        const data = await request.json()

        // Validate required fields
        if (!data.sku || !data.name || !data.categoryId) {
            return NextResponse.json(
                { error: 'SKU, name, and category are required' },
                { status: 400 }
            )
        }

        // Check if SKU already exists
        const existingProduct = await prisma.product.findUnique({
            where: { sku: data.sku }
        })

        if (existingProduct) {
            return NextResponse.json(
                { error: 'Product with this SKU already exists' },
                { status: 400 }
            )
        }

        const newProduct = await prisma.product.create({
            data: {
                sku: data.sku,
                name: data.name,
                categoryId: data.categoryId,
                stock: data.stock || 0,
                minStock: data.minStock || 10,
                location: data.location || '',
                value: data.value || 0,
                status: data.status || 'IN_STOCK',
                image: data.image || null
            },
            include: {
                category: true
            }
        })

        return NextResponse.json(newProduct, { status: 201 })
    } catch (error) {
        console.error('Error creating product:', error)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}