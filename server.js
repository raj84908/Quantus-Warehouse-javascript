// server.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

// GET all products
app.get('/api/products', async (req, res) => {
    const products = await prisma.product.findMany();
    res.json(products);
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
