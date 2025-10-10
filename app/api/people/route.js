import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// GET /api/people - Get all people (filtered by organization)
export const GET = withAuth(async (request, { user }) => {
    try {
        const people = await prisma.people.findMany({
            where: {
                organizationId: user.organizationId
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(people)
    } catch (error) {
        console.error('Error fetching people:', error)
        return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 })
    }
})

// POST /api/people - Create new person
export const POST = withAuth(async (request, { user }) => {
    try {
        const data = await request.json()

        // Validate required fields
        if (!data.name || !data.email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
        }

        // Check if email already exists in this organization
        const existingPerson = await prisma.people.findFirst({
            where: {
                email: data.email,
                organizationId: user.organizationId
            }
        })

        if (existingPerson) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }

        // Create new person record in database
        const newPerson = await prisma.people.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                department: data.department || null,
                position: data.position || null,
                status: data.status || 'Active',
                hireDate: data.hireDate ? new Date(data.hireDate) : null,
                performance: data.performance || null,
                type: data.type || 'staff',
                company: data.company || null,
                address: data.address || null,
                notes: data.notes || null,
                organizationId: user.organizationId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        return NextResponse.json(newPerson, { status: 201 })
    } catch (error) {
        console.error('Error creating person:', error)
        return NextResponse.json({ error: 'Failed to create person' }, { status: 500 })
    }
})
