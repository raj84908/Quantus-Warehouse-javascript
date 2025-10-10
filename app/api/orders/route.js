import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// Get all orders (filtered by organization)
export const GET = withAuth(async (request, { user }) => {
    try {
        const orders = await prisma.order.findMany({
            where: {
                organizationId: user.organizationId
            },
            include: {
                items: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
})

// Create a new order
export const POST = withAuth(async (req, { user }) => {
    try {
        const data = await req.json();

        // Create the order record with its items
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
                organizationId: user.organizationId,
                items: {
                    create: data.items.map(item => ({
                        sku: item.sku,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        productId: item.productId
                    }))
                }
            },
            include: {
                items: true
            }
        });

        // Update inventory quantities for each item in the order
        for (const item of data.items) {
            try {
                // Find the product by SKU in this organization
                const product = await prisma.product.findFirst({
                    where: {
                        sku: item.sku,
                        organizationId: user.organizationId
                    }
                });
                
                if (product) {
                    // Calculate new stock level
                    const newStock = Math.max(0, product.stock - item.quantity);
                    
                    // Update product stock
                    await prisma.product.update({
                        where: { id: product.id },
                        data: {
                            stock: newStock,
                            // Update status based on new stock level
                            status: newStock <= 0 ? 'OUT_OF_STOCK' :
                                    newStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK'
                        }
                    });
                    
                    // Create a stock adjustment record
                    await prisma.stockAdjustment.create({
                        data: {
                            productId: product.id,
                            quantity: -item.quantity, // Negative for deduction
                            previousStock: product.stock,
                            newStock: newStock,
                            reason: "order",
                            notes: `Order ${data.orderId}`,
                            adjustedBy: data.adjustedBy || "System"
                        }
                    });
                }
            } catch (itemError) {
                console.error(`Error updating inventory for item ${item.sku}:`, itemError);
                // Continue with the next item
            }
        }

        return NextResponse.json( order, { status: 201 });
    } catch (error) {
        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: "Failed to create order" },
            { status: 500 }
        );
    }
})