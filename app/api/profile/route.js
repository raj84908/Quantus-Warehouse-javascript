import { NextResponse } from 'next/server'

// In-memory storage for profile (starts empty - replace with your database)
let profile = null

// GET /api/profile - Get current user profile
export async function GET(request) {
    try {
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }
        return NextResponse.json(profile)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
}

// POST /api/profile - Create new profile
export async function POST(request) {
    try {
        const data = await request.json()

        // Validate required fields
        if (!data.firstName || !data.lastName || !data.email) {
            return NextResponse.json({
                error: 'First name, last name, and email are required'
            }, { status: 400 })
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }

        const newProfile = {
            id: 'profile_' + Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        profile = newProfile
        return NextResponse.json(newProfile, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }
}

// PUT /api/profile - Update profile
export async function PUT(request) {
    try {
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const data = await request.json()

        // Validate required fields
        if (!data.firstName || !data.lastName || !data.email) {
            return NextResponse.json({
                error: 'First name, last name, and email are required'
            }, { status: 400 })
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }

        // Update profile while preserving certain fields
        profile = {
            ...profile,
            ...data,
            id: profile.id, // Don't allow ID changes
            employeeId: profile.employeeId, // Don't allow employee ID changes
            joinDate: profile.joinDate, // Don't allow join date changes
            createdAt: profile.createdAt, // Don't allow created date changes
            updatedAt: new Date().toISOString()
        }

        return NextResponse.json(profile)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}

// DELETE /api/profile - Delete profile
export async function DELETE(request) {
    try {
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const deletedProfile = { ...profile }
        profile = null

        return NextResponse.json({
            message: 'Profile deleted successfully',
            profile: deletedProfile
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }
}