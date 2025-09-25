import { NextResponse } from 'next/server'

// Import the people array from the main route (in a real app, this would be database calls)
// For now, we'll maintain a separate empty array that gets populated as you add people
let people = []

// Helper function to sync with main route (in production, use database)
function getPeople() {
    // This is a simplified approach - in production, you'd query your database
    return people
}

function updatePeopleArray(updatedPeople) {
    people = updatedPeople
}

// GET /api/people/[id] - Get specific person
export async function GET(request, { params }) {
    try {
        const allPeople = getPeople()
        const person = allPeople.find(p => p.id === parseInt(params.id))

        if (!person) {
            return NextResponse.json({ error: 'Person not found' }, { status: 404 })
        }

        return NextResponse.json(person)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 })
    }
}

// PUT /api/people/[id] - Update specific person
export async function PUT(request, { params }) {
    try {
        const data = await request.json()
        const allPeople = getPeople()
        const personIndex = allPeople.findIndex(p => p.id === parseInt(params.id))

        if (personIndex === -1) {
            return NextResponse.json({ error: 'Person not found' }, { status: 404 })
        }

        // Validate required fields
        if (!data.name || !data.email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
        }

        // Check if email already exists (excluding current person)
        const emailExists = allPeople.find(person =>
            person.email === data.email && person.id !== parseInt(params.id)
        )
        if (emailExists) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }

        allPeople[personIndex] = {
            ...allPeople[personIndex],
            ...data,
            updatedAt: new Date().toISOString()
        }

        updatePeopleArray(allPeople)
        return NextResponse.json(allPeople[personIndex])
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update person' }, { status: 500 })
    }
}

// DELETE /api/people/[id] - Delete specific person
export async function DELETE(request, { params }) {
    try {
        const allPeople = getPeople()
        const personIndex = allPeople.findIndex(p => p.id === parseInt(params.id))

        if (personIndex === -1) {
            return NextResponse.json({ error: 'Person not found' }, { status: 404 })
        }

        const deletedPerson = allPeople.splice(personIndex, 1)[0]
        updatePeopleArray(allPeople)
        return NextResponse.json({ message: 'Person deleted successfully', person: deletedPerson })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete person' }, { status: 500 })
    }
}