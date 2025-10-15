import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

function validateProfile(data) {
    if (!data.firstName || !data.lastName || !data.email) {
        return 'First name, last name, and email are required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) return 'Invalid email format'
    return null
}

// GET /api/profile
export async function GET() {
    try {
        // Get the current session to identify the user
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Try to get existing profile
        let profile = await prisma.profile.findFirst()

        // If no profile exists, create one from AuthUser data
        if (!profile) {
            const authUser = await prisma.authUser.findUnique({
                where: { id: session.user.id },
                include: { organization: true }
            })

            if (!authUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            // Split name into first and last name
            const nameParts = (authUser.name || '').trim().split(' ')
            const firstName = nameParts[0] || 'User'
            const lastName = nameParts.slice(1).join(' ') || 'Profile'

            // Create profile with data from AuthUser
            profile = await prisma.profile.create({
                data: {
                    firstName,
                    lastName,
                    email: authUser.email,
                    phone: '',
                    location: '',
                    bio: '',
                    department: 'General',
                    position: authUser.role === 'OWNER' ? 'Owner' : authUser.role === 'ADMIN' ? 'Administrator' : 'Employee',
                    employeeId: 'EMP-' + authUser.id.toString().slice(-6),
                    joinDate: authUser.createdAt,
                    avatar: null
                }
            })
        }

        return NextResponse.json(profile)
    } catch (error) {
        console.error('Error fetching profile:', error)
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
}

// POST /api/profile
export async function POST(request) {
    try {
        const data = await request.json()
        const error = validateProfile(data)
        if (error) {
            return NextResponse.json({ error }, { status: 400 })
        }

        const existingProfile = await prisma.profile.findFirst()
        if (existingProfile) {
            return NextResponse.json(
                { error: 'Profile already exists. Use PUT to update.' },
                { status: 400 }
            )
        }

        const profile = await prisma.profile.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone || '',
                location: data.location || '',
                bio: data.bio || '',
                department: data.department || 'General',
                position: data.position || 'Employee',
                employeeId: data.employeeId || 'EMP-' + Date.now().toString().slice(-3),
                joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
                avatar: data.avatar || null
            }
        })

        return NextResponse.json(profile, { status: 201 })
    } catch (error) {
        console.error('Error creating profile:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Email or Employee ID already exists' },
                { status: 400 }
            )
        }
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }
}

// PUT /api/profile
export async function PUT(request) {
    try {
        const data = await request.json()
        const error = validateProfile(data)
        if (error) {
            return NextResponse.json({ error }, { status: 400 })
        }

        const existingProfile = await prisma.profile.findFirst()
        if (!existingProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const profile = await prisma.profile.update({
            where: { id: existingProfile.id },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone || '',
                location: data.location || '',
                bio: data.bio || '',
                department: data.department || existingProfile.department,
                position: data.position || existingProfile.position,
                avatar: data.avatar || existingProfile.avatar
            }
        })

        return NextResponse.json(profile)
    } catch (error) {
        console.error('Error updating profile:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}

// DELETE /api/profile
export async function DELETE() {
    try {
        const existingProfile = await prisma.profile.findFirst()
        if (!existingProfile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const deleted = await prisma.profile.delete({
            where: { id: existingProfile.id }
        })

        return NextResponse.json({ message: 'Profile deleted', profile: deleted })
    } catch (error) {
        console.error('Error deleting profile:', error)
        return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }
}