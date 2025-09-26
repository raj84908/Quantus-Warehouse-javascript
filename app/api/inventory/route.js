// server.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const prisma = new PrismaClient();

// Enable CORS
app.use(cors());

// Increase JSON body limit to handle large images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Profile password storage (use proper hashing in production)
let storedPasswordHash = null;

// Helper functions
function validateProfile(data) {
    if (!data.firstName || !data.lastName || !data.email) {
        return 'First name, last name, and email are required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) return 'Invalid email format';
    return null;
}

function hashPassword(password) {
    // This is just for demo - use bcrypt or similar in production
    return Buffer.from(password).toString('base64');
}

function verifyPassword(password, hash) {
    // This is just for demo - use proper verification like bcrypt
    return hashPassword(password) === hash;
}

// PROFILE ROUTES WITH PRISMA
// GET /api/profile
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

// POST /api/profile
app.post('/api/profile', async (req, res) => {
    try {
        const data = req.body;
        const error = validateProfile(data);
        if (error) {
            return res.status(400).json({ error });
        }

        // Check if profile already exists
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
            }
        });

        res.status(201).json(profile);
    } catch (error) {
        console.error('Error creating profile:', error);
        if (error.code === 'P2002') {
            // Unique constraint violation
            res.status(400).json({ error: 'Email or Employee ID already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create profile' });
        }
    }
});

// PUT /api/profile
app.put('/api/profile', async (req, res) => {
    try {
        const data = req.body;
        const error = validateProfile(data);
        if (error) {
            return res.status(400).json({ error });
        }

        // Find existing profile
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
                department: data.department,
                position: data.position,
                avatar: data.avatar
            }
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

// DELETE /api/profile
app.delete('/api/profile', async (req, res) => {
    try {
        const profile = await prisma.profile.findFirst();
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const deleted = await prisma.profile.delete({
            where: { id: profile.id }
        });

        res.json({ message: 'Profile deleted', profile: deleted });
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

// PUT /api/profile/password - Change password
app.put('/api/profile/password', (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Current password and new password are required'
            });
        }

        // Validate new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'New password must be at least 6 characters long'
            });
        }

        // For demo purposes, if no password is set yet, accept any current password
        if (storedPasswordHash && !verifyPassword(currentPassword, storedPasswordHash)) {
            return res.status(400).json({
                error: 'Current password is incorrect'
            });
        }

        // Hash and store new password
        storedPasswordHash = hashPassword(newPassword);

        res.json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// PUT /api/profile/avatar - Update profile avatar
app.put('/api/profile/avatar', async (req, res) => {
    try {
        const { avatar } = req.body;

        const existingProfile = await prisma.profile.findFirst();
        if (!existingProfile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        // Validate avatar data
        if (!avatar || !avatar.startsWith('data:image/')) {
            return res.status(400).json({
                error: 'Invalid avatar data'
            });
        }

        // Check file size (base64 encoded, so roughly 4/3 the original size)
        const sizeInBytes = (avatar.length * 3) / 4;
        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

        if (sizeInBytes > maxSizeInBytes) {
            return res.status(400).json({
                error: 'Avatar file size must be less than 5MB'
            });
        }

        // Update profile with new avatar
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

// DELETE /api/profile/avatar - Remove profile avatar
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

// EXISTING PRODUCT ROUTES
// GET all products (with optional search and category filter)
app.get('/api/products', async (req, res) => {
    const { search, category } = req.query;

    let whereConditions = {};

    if (search && search.trim() !== "") {
        whereConditions.OR = [
            { name: { contains: search } },
            { sku: { contains: search } },
            { category: { name: { contains: search } } },
            { location: { contains: search } },
        ];
    }

    if (category && category !== 'all' && category.trim() !== "") {
        const categoryMap = {
            'electronics': 'Electronics',
            'components': 'Components',
            'kits': 'Kits',
            'accessories': 'Accessories'
        };
        const mappedCategory = categoryMap[category.toLowerCase()] || category;
        whereConditions.category = { name: { equals: mappedCategory } };
    }

    try {
        const products = await prisma.product.findMany({
            where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
            include: {
                category: true
            }
        });
        res.json(products);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST new product with upsert to handle duplicate SKU
app.post('/api/products', async (req, res) => {
    try {
        const data = req.body;
        let imageUrl = null;

        // Handle base64 image upload
        if (data.image) {
            const base64Data = data.image.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');

            const uploadDir = path.join(__dirname, 'public/uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `${Date.now()}-${data.sku}.png`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);

            imageUrl = `/uploads/${fileName}`;
        }

        const product = await prisma.product.upsert({
            where: { sku: data.sku },
            update: {
                name: data.name,
                category: { connect: { id: data.categoryId } },
                location: data.location,
                stock: data.stock,
                minStock: data.minStock,
                value: data.value,
                status: data.status,
                lastUpdated: new Date(data.lastUpdated),
                image: imageUrl,
            },
            create: {
                sku: data.sku,
                name: data.name,
                category: { connect: { id: data.categoryId } },
                location: data.location,
                stock: data.stock,
                minStock: data.minStock,
                value: data.value,
                status: data.status,
                lastUpdated: new Date(data.lastUpdated),
                image: imageUrl,
            },
        });

        res.json(product);
    } catch (error) {
        console.error('Error adding/updating product:', error);
        res.status(500).json({ error: 'Failed to add or update product' });
    }
});

// PUT update product
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { sku, name, categoryId, location, stock, minStock, value, status, image } = req.body;

    try {
        const updated = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                sku,
                name,
                categoryId: Number(categoryId),
                location,
                stock: Number(stock),
                minStock: Number(minStock),
                value: Number(value),
                status: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].includes(status) ? status : 'IN_STOCK',
                image: image || null,
            },
        });

        res.json(updated);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product" });
    }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.stockAdjustment.updateMany({
            where: { productId: Number(id) },
            data: { productId: null }
        });

        await prisma.product.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// STOCK ADJUSTMENT ROUTES
app.post('/api/stock-adjustments', async (req, res) => {
    const { productId, quantity, reason, notes, adjustedBy } = req.body;

    try {
        const result = await prisma.$transaction(async (prisma) => {
            const product = await prisma.product.findUnique({
                where: { id: Number(productId) }
            });

            if (!product) {
                throw new Error('Product not found');
            }

            const previousStock = product.stock;
            const newStock = previousStock + quantity;

            const updatedProduct = await prisma.product.update({
                where: { id: Number(productId) },
                data: {
                    stock: newStock,
                    lastUpdated: new Date(),
                    status: newStock <= 0 ? 'OUT_OF_STOCK' :
                        newStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK'
                }
            });

            const stockAdjustment = await prisma.stockAdjustment.create({
                data: {
                    productId: Number(productId),
                    quantity,
                    previousStock,
                    newStock,
                    reason,
                    notes: notes || '',
                    adjustedBy: adjustedBy || '',
                }
            });

            return {
                product: updatedProduct,
                adjustment: stockAdjustment
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Error creating stock adjustment:', error);
        res.status(500).json({ error: 'Failed to create stock adjustment' });
    }
});

app.get('/api/stock-adjustments', async (req, res) => {
    const { productId, reason, startDate, endDate, limit, offset } = req.query;

    try {
        let whereConditions = {};

        if (productId) {
            whereConditions.productId = Number(productId);
        }

        if (reason) {
            whereConditions.reason = reason;
        }

        if (startDate || endDate) {
            whereConditions.createdAt = {};

            if (startDate) {
                whereConditions.createdAt.gte = new Date(startDate);
            }

            if (endDate) {
                whereConditions.createdAt.lte = new Date(endDate);
            }
        }

        const adjustments = await prisma.stockAdjustment.findMany({
            where: whereConditions,
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit ? parseInt(limit) : undefined,
            skip: offset ? parseInt(offset) : undefined
        });

        res.json(adjustments);
    } catch (error) {
        console.error('Error fetching stock adjustments:', error);
        res.status(500).json({ error: 'Failed to fetch stock adjustments' });
    }
});

app.delete('/api/stock-adjustments/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await prisma.stockAdjustment.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Stock adjustment deleted', deleted });
    } catch (error) {
        console.error('Error deleting stock adjustment:', error);
        res.status(500).json({ error: 'Failed to delete stock adjustment' });
    }
});

// ORDER ROUTES
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: { items: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.post('/api/orders', async (req, res) => {
    const data = req.body;
    try {
        const order = await prisma.order.create({
            data: {
                orderId: data.orderId,
                customer: data.customer,
                email: data.email,
                phone: data.phone || null,
                billingAddress: data.billingAddress || null,
                subtotal: data.subtotal,
                total: data.total,
                status: data.status,
                priority: data.priority,
                dueDate: data.dueDate,
                assignedTo: data.assignedTo,
                items: { create: data.items }
            },
            include: { items: true }
        });
        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// PEOPLE ROUTES WITH PRISMA
// GET /api/people - Get all people
app.get('/api/people', async (req, res) => {
    try {
        const people = await prisma.people.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(people);
    } catch (error) {
        console.error('Error fetching people:', error);
        res.status(500).json({ error: 'Failed to fetch people' });
    }
});

// POST /api/people - Create new person
app.post('/api/people', async (req, res) => {
    try {
        const data = req.body;

        // Validate required fields
        if (!data.name || !data.email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if email already exists
        const existingPerson = await prisma.people.findUnique({
            where: { email: data.email }
        });

        if (existingPerson) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const newPerson = await prisma.people.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                department: data.department || null,
                position: data.position || null,
                status: data.status || 'Active',
                hireDate: data.hireDate ? new Date(data.hireDate) : null,
                performance: data.performance || null,
                type: data.type || 'staff',
                company: data.company || null,
                address: data.address || null,
                notes: data.notes || null
            }
        });

        res.status(201).json(newPerson);
    } catch (error) {
        console.error('Error creating person:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create person' });
        }
    }
});

// GET /api/people/:id - Get specific person
app.get('/api/people/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const person = await prisma.people.findUnique({
            where: { id: Number(id) }
        });

        if (!person) {
            return res.status(404).json({ error: 'Person not found' });
        }

        res.json(person);
    } catch (error) {
        console.error('Error fetching person:', error);
        res.status(500).json({ error: 'Failed to fetch person' });
    }
});

// PUT /api/people/:id - Update specific person
app.put('/api/people/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Validate required fields
        if (!data.name || !data.email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Check if email already exists (excluding current person)
        const existingPerson = await prisma.people.findFirst({
            where: {
                email: data.email,
                NOT: { id: Number(id) }
            }
        });

        if (existingPerson) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const updatedPerson = await prisma.people.update({
            where: { id: Number(id) },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                department: data.department || null,
                position: data.position || null,
                status: data.status || 'Active',
                hireDate: data.hireDate ? new Date(data.hireDate) : null,
                performance: data.performance || null,
                type: data.type || 'staff',
                company: data.company || null,
                address: data.address || null,
                notes: data.notes || null
            }
        });

        res.json(updatedPerson);
    } catch (error) {
        console.error('Error updating person:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Email already exists' });
        } else if (error.code === 'P2025') {
            res.status(404).json({ error: 'Person not found' });
        } else {
            res.status(500).json({ error: 'Failed to update person' });
        }
    }
});

// DELETE /api/people/:id - Delete specific person
app.delete('/api/people/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPerson = await prisma.people.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Person deleted successfully', person: deletedPerson });
    } catch (error) {
        console.error('Error deleting person:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Person not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete person' });
        }
    }
});

// CATEGORY ROUTES
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('API server is running');
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});