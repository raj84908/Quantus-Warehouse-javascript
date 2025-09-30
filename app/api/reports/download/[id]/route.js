const express = require('express')
const router = express.Router()
import { prisma } from '@/lib/prisma'


// Helper: validate required fields
function validateProfile(data) {
    if (!data.firstName || !data.lastName || !data.email) {
        return 'First name, last name, and email are required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) return 'Invalid email format'
    return null
}

// GET /api/profile
router.get('/', async (req, res) => {
    try {
        const profile = await prisma.profile.findFirst()
        if (!profile) return res.status(404).json({ error: 'Profile not found' })
        res.json(profile)
    } catch (error) {
        console.error('Error fetching profile:', error)
        res.status(500).json({ error: 'Failed to fetch profile' })
    }
})

// POST /api/profile
router.post('/', async (req, res) => {
    try {
        const data = req.body
        const error = validateProfile(data)
        if (error) return res.status(400).json({ error })

        // Check if profile already exists
        const existingProfile = await prisma.profile.findFirst()
        if (existingProfile) {
            return res.status(400).json({ error: 'Profile already exists. Use PUT to update.' })
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
                avatar: data.avatar || null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        res.status(201).json(profile)
    } catch (error) {
        console.error('Error creating profile:', error)
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Email or Employee ID already exists' })
        } else {
            res.status(500).json({ error: 'Failed to create profile' })
        }
    }
})

// PUT /api/profile
router.put('/', async (req, res) => {
    try {
        const existingProfile = await prisma.profile.findFirst()
        if (!existingProfile) return res.status(404).json({ error: 'Profile not found' })

        const data = req.body
        const error = validateProfile(data)
        if (error) return res.status(400).json({ error })

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
                avatar: data.avatar || existingProfile.avatar,
                updatedAt: new Date()
            }
        })

        res.json(profile)
    } catch (error) {
        console.error('Error updating profile:', error)
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Email already exists' })
        } else {
            res.status(500).json({ error: 'Failed to update profile' })
        }
    }
})

// DELETE /api/profile
router.delete('/', async (req, res) => {
    try {
        const existingProfile = await prisma.profile.findFirst()
        if (!existingProfile) return res.status(404).json({ error: 'Profile not found' })

        const deleted = await prisma.profile.delete({ where: { id: existingProfile.id } })
        res.json({ message: 'Profile deleted', profile: deleted })
    } catch (error) {
        console.error('Error deleting profile:', error)
        res.status(500).json({ error: 'Failed to delete profile' })
    }
})

module.exports = router
