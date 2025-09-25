import { NextResponse } from 'next/server'

// In-memory storage (starts empty - replace with your database)
let people = []
let nextId = 1

// GET /api/people - Get all people
export async function GET(request) {
    try {
        return NextResponse.json(people)
    } catch (error) {
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
        if (people.find(person => person.email === data.email)) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }

        const newPerson = {
            id: nextId++,
            ...data,
            hireDate: data.hireDate || null,
            createdAt: new Date().toISOString()
        }

        people.push(newPerson)
        return NextResponse.json(newPerson, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create person' }, { status: 500 })
    }
}