import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// GET /api/categories - Get all categories (filtered by organization)
export const GET = withAuth(async (request, { user }) => {
    try {
        const categories = await prisma.category.findMany({
            where: {
                organizationId: user.organizationId
            },
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
})

// POST /api/categories - Create new category
export const POST = withAuth(async (request, { user }) => {
    try {
        const { name } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
        }

        const newCategory = await prisma.category.create({
            data: {
                name,
                organizationId: user.organizationId
            }
        })

        return NextResponse.json(newCategory, { status: 201 })
    } catch (error) {
        console.error('Error creating category:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
})