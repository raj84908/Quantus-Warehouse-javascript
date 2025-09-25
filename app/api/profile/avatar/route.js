import { NextResponse } from 'next/server'

// This would connect to your main profile storage
// For demo, we'll maintain a reference to the profile
let profileReference = null

// Helper to get profile (in production, this would be a database query)
function getProfile() {
    return profileReference
}

function updateProfile(updatedData) {
    if (profileReference) {
        profileReference = { ...profileReference, ...updatedData }
    }
}

// PUT /api/profile/avatar - Update profile avatar
export async function PUT(request) {
    try {
        const { avatar } = await request.json()

        const profile = getProfile()
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        // Validate avatar data
        if (!avatar || !avatar.startsWith('data:image/')) {
            return NextResponse.json({
                error: 'Invalid avatar data'
            }, { status: 400 })
        }

        // Check file size (base64 encoded, so roughly 4/3 the original size)
        const sizeInBytes = (avatar.length * 3) / 4
        const maxSizeInBytes = 5 * 1024 * 1024 // 5MB

        if (sizeInBytes > maxSizeInBytes) {
            return NextResponse.json({
                error: 'Avatar file size must be less than 5MB'
            }, { status: 400 })
        }

        // Update profile with new avatar
        const updatedProfile = {
            ...profile,
            avatar,
            updatedAt: new Date().toISOString()
        }

        updateProfile(updatedProfile)
        profileReference = updatedProfile

        return NextResponse.json(updatedProfile)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update avatar' }, { status: 500 })
    }
}

// DELETE /api/profile/avatar - Remove profile avatar
export async function DELETE(request) {
    try {
        const profile = getProfile()
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        const updatedProfile = {
            ...profile,
            avatar: null,
            updatedAt: new Date().toISOString()
        }

        updateProfile(updatedProfile)
        profileReference = updatedProfile

        return NextResponse.json(updatedProfile)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
    }
}