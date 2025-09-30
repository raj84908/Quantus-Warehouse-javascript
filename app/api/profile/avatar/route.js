import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/profile/avatar - Update profile avatar
export async function PUT(request) {
    try {
        const { avatar } = await request.json()

        const profile = await prisma.profile.findFirst()
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Validate avatar data
        if (!avatar || !avatar.startsWith('data:image/')) {
            return NextResponse.json({ error: 'Invalid avatar data' }, { status: 400 })
        }

        // Check file size (base64 encoded, so roughly 4/3 the original size)
        const sizeInBytes = (avatar.length * 3) / 4
        const maxSizeInBytes = 5 * 1024 * 1024 // 5MB

        if (sizeInBytes > maxSizeInBytes) {
            return NextResponse.json({ error: 'Avatar file size must be less than 5MB' }, { status: 400 })
        }

        const updatedProfile = await prisma.profile.update({
            where: { id: profile.id },
            data: {
                avatar,
                updatedAt: new Date()
            }
        })

        return NextResponse.json(updatedProfile)
    } catch (error) {
        console.error('Error updating avatar:', error)
        return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
    }
}

// DELETE /api/profile/avatar - Remove profile avatar
export async function DELETE(request) {
    try {
        const profile = await prisma.profile.findFirst()
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const updatedProfile = await prisma.profile.update({
            where: { id: profile.id },
            data: {
                avatar: null,
                updatedAt: new Date()
            }
        })

        return NextResponse.json(updatedProfile)
    } catch (error) {
        console.error('Error removing avatar:', error)
        return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
    }
}
