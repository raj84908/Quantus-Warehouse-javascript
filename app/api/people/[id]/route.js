import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// GET /api/people/[id] - Get specific person
export const GET = withAuth(async (request, { params, user }) => {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid person ID' }, { status: 400 })
        }

        const person = await prisma.people.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!person) {
            return NextResponse.json({ error: 'Person not found' }, { status: 404 })
        }

        return NextResponse.json(person)
    } catch (error) {
        console.error('Error fetching person:', error)
        return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 })
    }
})

// PUT /api/people/[id] - Update specific person
export const PUT = withAuth(async (request, { params, user }) => {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid person ID' }, { status: 400 })
        }

        const data = await request.json()

        // Validate fields
        if (!data.name || !data.email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
        }

        // Verify person belongs to user's organization
        const existingPerson = await prisma.people.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!existingPerson) {
            return NextResponse.json({ error: 'Person not found' }, { status: 404 })
        }

        // Check if email exists on different person IN THIS ORGANIZATION
        const emailExists = await prisma.people.findFirst({
            where: {
                email: data.email,
                organizationId: user.organizationId,
                NOT: { id }
            }
        })

        if (emailExists) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }

        const updatedPerson = await prisma.people.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date()
            }
        })

        return NextResponse.json(updatedPerson)
    } catch (error) {
        console.error('Error updating person:', error)
        return NextResponse.json({ error: 'Failed to update person' }, { status: 500 })
    }
})

// DELETE /api/people/[id] - Delete specific person
export const DELETE = withAuth(async (request, { params, user }) => {
    try {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid person ID' }, { status: 400 })
        }

        // Verify person belongs to user's organization
        const person = await prisma.people.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            }
        })

        if (!person) {
            return NextResponse.json({ error: 'Person not found' }, { status: 404 })
        }

        await prisma.people.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Person deleted successfully' })
    } catch (error) {
        console.error('Error deleting person:', error)
        return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 })
    }
})