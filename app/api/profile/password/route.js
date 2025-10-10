import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

// PUT /api/profile/password - Change password
export async function PUT(request) {
    try {
        const { currentPassword, newPassword } = await request.json()

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 })
        }

        // Get user profile (assuming unique single profile)
        const profile = await prisma.profile.findFirst()

        // If no profile or password exists yet, accept change (initial set)
        if (!profile || !profile.password) {
            const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
            if (profile) {
                await prisma.profile.update({
                    where: { id: profile.id },
                    data: { password: hashedPassword }
                })
            }
            return NextResponse.json({ message: 'Password set successfully' })
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, profile.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }

        // Hash new password and save
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)
        await prisma.profile.update({
            where: { id: profile.id },
            data: { password: hashedPassword }
        })

        return NextResponse.json({ message: 'Password changed successfully' })
    } catch (error) {
        console.error('Failed to change password:', error)
        return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
    }
}
