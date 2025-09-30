import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


// GET /api/people/[id] - Get specific person
export async function GET(request, { params }) {
    try {
        const person = await prisma.people.findUnique({
            where: { id: Number(params.id) }
        })

        if (!person) {
            return NextResponse.json({ error: 'Person not found' }, { status: 404 })
        }

        return NextResponse.json(person)
    } catch (error) {
        console.error('Error fetching person:', error)
        return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 })
    }
}

// PUT /api/people/[id] - Update specific person
export async function PUT(request, { params }) {
    try {
        const data = await request.json()

        // Validate fields
        if (!data.name || !data.email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
        }

        // Check if email exists on different person
        const emailExists = await prisma.people.findFirst({
            where: {
                email: data.email,
                NOT: { id: Number(params.id) }
            }
        })

        if (emailExists) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }

        const updatedPerson = await prisma.people.update({
            where: { id: Number(params.id) },
            data: {
                ...data,
                updatedAt: new Date()
            }
        })

        return NextResponse.json(updatedPerson)
    } catch (error) {
        console.error('Error updating person:', error)

        if (error.code === 'P2025') {
            // Record not found error
            return NextResponse.json({ error: 'Person not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to update person' }, { status: 500 })
    }
}

// DELETE /api/people/[id] - Delete specific person
export async function DELETE(request, { params }) {
    try {
        const deletedPerson = await prisma.people.delete({
            where: { id: Number(params.id) }
        })

        return NextResponse.json({ message: 'Person deleted successfully', person: deletedPerson })
    } catch (error) {
        console.error('Error deleting person:', error)

        if (error.code === 'P2025') {
            return NextResponse.json({ error: 'Person not found' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 })
    }
}
