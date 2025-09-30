import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/people - Get all people
export async function GET(request) {
    try {
        const people = await prisma.people.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(people)
    } catch (error) {
        console.error('Error fetching people:', error)
        return NextResponse.json({ error: 'Failed to fetch people' }, { status: 500 })
    }
}

// POST /api/people - Create new person
export async function POST(request) {
    try {
        const data = await request.json()

        // Validate required fields
        if (!data.name || !data.email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
        }

        // Check if email already exists
        const existingPerson = await prisma.people.findUnique({
            where: { email: data.email }
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
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        return NextResponse.json(newPerson, { status: 201 })
    } catch (error) {
        console.error('Error creating person:', error)
        return NextResponse.json({ error: 'Failed to create person' }, { status: 500 })
    }
}
