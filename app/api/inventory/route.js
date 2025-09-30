/*
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const prisma = require('../../../lib/prisma'); // Using Prisma singleton from separate module

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const app = express();
const SALT_ROUNDS = 10;

// Enable CORS
app.use(cors());

// Increase JSON body limit to handle large images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Helper functions
function validateProfile(data) {
    if (!data.firstName || !data.lastName || !data.email) {
        return 'First name, last name, and email are required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) return 'Invalid email format';
    return null;
}


app.get('/api/products', async (req, res) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// PROFILE ROUTES WITH PRISMA
app.get('/api/profile', async (req, res) => {
    try {
        const profile = await prisma.profile.findFirst();
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.post('/api/profile', async (req, res) => {
    try {
        const data = req.body;
        const error = validateProfile(data);
        if (error) return res.status(400).json({ error });

        const existingProfile = await prisma.profile.findFirst();
        if (existingProfile) {
            return res.status(400).json({ error: 'Profile already exists. Use PUT to update.' });
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
            },
        });

        res.status(201).json(profile);
    } catch (error) {
        console.error('Error creating profile:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Email or Employee ID already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create profile' });
        }
    }
});

app.put('/api/profile', async (req, res) => {
    try {
        const data = req.body;
        const error = validateProfile(data);
        if (error) return res.status(400).json({ error });

        const existingProfile = await prisma.profile.findFirst();
        if (!existingProfile) {
            return res.status(404).json({ error: 'Profile not found' });
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
                avatar: data.avatar || existingProfile.avatar,
            },
        });

        res.json(profile);
    } catch (error) {
        console.error('Error updating profile:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
});

app.delete('/api/profile', async (req, res) => {
    try {
        const existingProfile = await prisma.profile.findFirst();
        if (!existingProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const deleted = await prisma.profile.delete({
            where: { id: existingProfile.id },
        });

        res.json({ message: 'Profile deleted', profile: deleted });
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

// Password change with bcrypt hashing and verification
app.put('/api/profile/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        const profile = await prisma.profile.findFirst();
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // If no password set, allow set directly
        if (!profile.password) {
            const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
            await prisma.profile.update({
                where: { id: profile.id },
                data: { password: hashedPassword }
            });
            return res.json({ message: 'Password set successfully' });
        }

        const isValid = await bcrypt.compare(currentPassword, profile.password);
        if (!isValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await prisma.profile.update({
            where: { id: profile.id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Avatar update
app.put('/api/profile/avatar', async (req, res) => {
    try {
        const { avatar } = req.body;
        const existingProfile = await prisma.profile.findFirst();

        if (!existingProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        if (!avatar || !avatar.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Invalid avatar data' });
        }

        const sizeInBytes = (avatar.length * 3) / 4;
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

        if (sizeInBytes > maxSizeInBytes) {
            return res.status(400).json({ error: 'Avatar file size must be less than 5MB' });
        }

        const profile = await prisma.profile.update({
            where: { id: existingProfile.id },
            data: { avatar }
        });

        res.json(profile);
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

// Avatar delete
app.delete('/api/profile/avatar', async (req, res) => {
    try {
        const existingProfile = await prisma.profile.findFirst();

        if (!existingProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const profile = await prisma.profile.update({
            where: { id: existingProfile.id },
            data: { avatar: null }
        });

        res.json(profile);
    } catch (error) {
        console.error('Error removing avatar:', error);
        res.status(500).json({ error: 'Failed to remove avatar' });
    }
});

// The rest of your routes (products, orders, people, stock adjustments, categories)
// remain unchanged except you should import prisma from singleton

// Root route
app.get('/', (req, res) => {
    res.send('API server is running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on ${API_BASE}`);
});
*/