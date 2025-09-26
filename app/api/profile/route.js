// backend/api/profile.js
const express = require('express')
const router = express.Router()

// In-memory storage (replace with database in production)
let profile = null

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
router.get('/', (req, res) => {
    if (!profile) return res.status(404).json({ error: 'Profile not found' })
    res.json(profile)
})

// POST /api/profile
router.post('/', (req, res) => {
    const data = req.body
    const error = validateProfile(data)
    if (error) return res.status(400).json({ error })

    profile = {
        id: 'profile_' + Date.now(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
    }
    res.status(201).json(profile)
})

// PUT /api/profile
router.put('/', (req, res) => {
    if (!profile) return res.status(404).json({ error: 'Profile not found' })

    const data = req.body
    const error = validateProfile(data)
    if (error) return res.status(400).json({ error })

    profile = {
        ...profile,
        ...data,
        id: profile.id,          // keep original id
        employeeId: profile.employeeId, // preserve employeeId if exists
        joinDate: profile.joinDate,     // preserve joinDate
        createdAt: profile.createdAt,
        updatedAt: new Date()
    }

    res.json(profile)
})

// DELETE /api/profile
router.delete('/', (req, res) => {
    if (!profile) return res.status(404).json({ error: 'Profile not found' })
    const deleted = profile
    profile = null
    res.json({ message: 'Profile deleted', profile: deleted })
})

module.exports = router
