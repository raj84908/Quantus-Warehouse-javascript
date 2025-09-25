import { NextResponse } from 'next/server'

// In a real app, you'd have proper password hashing and verification
// This is a simplified example
let storedPasswordHash = null // This would be stored securely in your database

// Simple password hashing simulation (use bcrypt or similar in production)
function hashPassword(password) {
    // This is just for demo - use proper hashing like bcrypt
    return Buffer.from(password).toString('base64')
}

function verifyPassword(password, hash) {
    // This is just for demo - use proper verification like bcrypt
    return hashPassword(password) === hash
}

// PUT /api/profile/password - Change password
export async function PUT(request) {
    try {
        const { currentPassword, newPassword } = await request.json()

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return NextResponse.json({
                error: 'Current password and new password are required'
            }, { status: 400 })
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return NextResponse.json({
                error: 'New password must be at least 6 characters long'
            }, { status: 400 })
        }

        // For demo purposes, if no password is set yet, accept any current password
        if (storedPasswordHash && !verifyPassword(currentPassword, storedPasswordHash)) {
            return NextResponse.json({
                error: 'Current password is incorrect'
            }, { status: 400 })
        }

        // Hash and store new password
        storedPasswordHash = hashPassword(newPassword)

        return NextResponse.json({
            message: 'Password changed successfully'
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
    }
}