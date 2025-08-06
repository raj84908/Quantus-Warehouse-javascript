// server.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

// GET all products (with optional search and category filter)
app.get('/api/products', async (req, res) => {
    const { search, category } = req.query; // Extract search and category from query parameters
    
    console.log('Received search parameter:', search);
    console.log('Received category parameter:', category);
    
    let whereConditions = {};
    
    // Build search conditions
    if (search && search.trim() !== "") {
        whereConditions.OR = [
            { name: { contains: search } },
            { sku: { contains: search } },
            { category: { contains: search } },
            { location: { contains: search } },
        ];
    }
    
    // Add category filter (if not 'all' or empty)
    if (category && category !== 'all' && category.trim() !== "") {
        // Convert to proper case to match database values
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
        
        console.log('Query results:', products.length, 'products found');
        res.json(products);
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST new product
app.post('/api/products', async (req, res) => {
    const product = await prisma.product.create({ data: req.body });
    res.json(product);
});

// PUT update product
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const product = await prisma.product.update({
        where: { id: Number(id) },
        data: req.body,
    });
    res.json(product);
});

// DELETE a product
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    await prisma.product.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deleted successfully' });
});

// Root route for testing
app.get('/', (req, res) => {
    res.send('API server is running');
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});