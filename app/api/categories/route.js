import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - Get all categories
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })
        return NextResponse.json(categories)
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
}

// POST /api/categories - Create new category
export async function POST(request) {
    try {
        const { name } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
        }

        const newCategory = await prisma.category.create({
            data: { name }
        })

        return NextResponse.json(newCategory, { status: 201 })
    } catch (error) {
        console.error('Error creating category:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
}