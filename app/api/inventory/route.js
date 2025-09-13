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
// Adjust stock by delta (positive = add, negative = remove)
app.put('/api/products/:id/adjust', async (req, res) => {
    const { id } = req.params;
    const { delta } = req.body;

    try {
        const product = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                stock: { increment: delta },
            },
        });
        res.json(product);
    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(500).json({ error: 'Failed to adjust stock' });
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



//Stock Adjustment stuff

// Add this to your route.js file

// POST create a new stock adjustment record and update product stock
app.post('/api/stock-adjustments', async (req, res) => {
    const { productId, quantity, reason, notes, adjustedBy } = req.body;

    try {
        // Start a transaction to ensure both operations succeed or fail together
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Get the current product
            const product = await prisma.product.findUnique({
                where: { id: Number(productId) }
            });

            if (!product) {
                throw new Error('Product not found');
            }

            const previousStock = product.stock;
            const newStock = previousStock + quantity;

            // 2. Update the product stock
            const updatedProduct = await prisma.product.update({
                where: { id: Number(productId) },
                data: {
                    stock: newStock,
                    lastUpdated: new Date(),
                    // Update status based on new stock level compared to minStock
                    status: newStock <= 0 ? 'OUT_OF_STOCK' :
                        newStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK'
                }
            });

            // 3. Create a stock adjustment record
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

// GET all stock adjustments with optional filtering
app.get('/api/stock-adjustments', async (req, res) => {
    const { productId, reason, startDate, endDate } = req.query;

    try {
        let whereConditions = {};

        if (productId) {
            whereConditions.productId = Number(productId);
        }

        if (reason) {
            whereConditions.reason = reason;
        }

        // Date range filter
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
            }
        });

        res.json(adjustments);
    } catch (error) {
        console.error('Error fetching stock adjustments:', error);
        res.status(500).json({ error: 'Failed to fetch stock adjustments' });
    }
});

// GET a specific adjustment by ID

// GET stock adjustments with limit and offset
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

        // Date range filter
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



// Root route
app.get('/', (req, res) => {
    res.send('API server is running');
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
