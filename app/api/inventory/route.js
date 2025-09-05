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

// GET all products (with optional search and category filter)
app.get('/api/products', async (req, res) => {
    const { search, category } = req.query;

    let whereConditions = {};

    if (search && search.trim() !== "") {
        whereConditions.OR = [
            { name: { contains: search } },
            { sku: { contains: search } },
            { category: { contains: search } },
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
        whereConditions.category = { equals: mappedCategory };
    }

    try {
        const products = await prisma.product.findMany({
            where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
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
                category: data.category,
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
                category: data.category,
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
    try {
        const product = await prisma.product.update({
            where: { id: Number(id) },
            data: req.body,
        });
        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.product.delete({ where: { id: Number(id) } });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
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
