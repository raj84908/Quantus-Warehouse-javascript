import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

export const PATCH = withAuth(async (request, { params, user }) => {
    try {
        const { id } = params;
        const body = await request.json();

        // If items are being updated, we need to handle stock adjustments
        if (body.items) {
            // Get the existing order with items
            const existingOrder = await prisma.order.findUnique({
                where: { id: parseInt(id) },
                include: { items: true }
            });

            if (!existingOrder) {
                return NextResponse.json(
                    { error: "Order not found" },
                    { status: 404 }
                );
            }

            // Verify organization ownership
            if (existingOrder.organizationId !== user.organizationId) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 403 }
                );
            }

            // Step 1: Restore stock for old items
            for (const oldItem of existingOrder.items) {
                if (oldItem.productId) {
                    const product = await prisma.product.findUnique({
                        where: { id: oldItem.productId }
                    });

                    if (product) {
                        const restoredStock = product.stock + oldItem.quantity;
                        const newStatus = restoredStock <= 0 ? 'OUT_OF_STOCK' :
                                        restoredStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK';

                        await prisma.product.update({
                            where: { id: product.id },
                            data: {
                                stock: restoredStock,
                                status: newStatus
                            }
                        });

                        // Create stock adjustment record for restoration
                        await prisma.stockAdjustment.create({
                            data: {
                                productId: product.id,
                                quantity: oldItem.quantity,  // Positive for restoration
                                previousStock: product.stock,
                                newStock: restoredStock,
                                reason: "Order Edit - Stock Restored",
                                notes: `Order ${existingOrder.orderId} edited - restored ${oldItem.quantity} units`,
                                adjustedBy: user.name || "System"
                            }
                        });
                    }
                }
            }

            // Step 2: Delete existing items
            await prisma.orderItem.deleteMany({
                where: { orderId: parseInt(id) }
            });

            // Step 3: Deduct stock for new items
            for (const newItem of body.items) {
                if (newItem.productId) {
                    const product = await prisma.product.findUnique({
                        where: { id: newItem.productId }
                    });

                    if (product) {
                        const newStock = Math.max(0, product.stock - newItem.quantity);
                        const newStatus = newStock <= 0 ? 'OUT_OF_STOCK' :
                                        newStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK';

                        await prisma.product.update({
                            where: { id: product.id },
                            data: {
                                stock: newStock,
                                status: newStatus
                            }
                        });

                        // Create stock adjustment record for deduction
                        await prisma.stockAdjustment.create({
                            data: {
                                productId: product.id,
                                quantity: -newItem.quantity,  // Negative for deduction
                                previousStock: product.stock,
                                newStock: newStock,
                                reason: "Order Edit - Stock Deducted",
                                notes: `Order ${existingOrder.orderId} edited - deducted ${newItem.quantity} units`,
                                adjustedBy: user.name || "System"
                            }
                        });
                    }
                }
            }
        }

        // Update the order
        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: {
                customer: body.customer,
                email: body.email,
                phone: body.phone,
                billingAddress: body.billingAddress,
                subtotal: body.subtotal,
                total: body.total,
                status: body.status,
                ...(body.items && {
                    items: {
                        create: body.items.map(item => ({
                            sku: item.sku,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            productId: item.productId
                        }))
                    }
                })
            },
            include: {
                items: true
            }
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error(`Error updating order ${params.id}:`, error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
})



// Get a specific order by ID
export const GET = withAuth(async (request, { params, user }) => {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json(
                { error: "Invalid order ID" },
                { status: 400 }
            );
        }

        const order = await prisma.order.findFirst({
            where: {
                id,
                organizationId: user.organizationId
            },
            include: {
                items: true
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error(`Error fetching order ${params.id}:`, error);
        return NextResponse.json(
            { error: "Failed to fetch order" },
            { status: 500 }
        );
    }
})

// DELETE /api/orders/:id
export const DELETE = withAuth(async (request, { params, user }) => {
    try {
        const { id } = params;
        console.log('Deleting order with ID:', id);

        // Get the order with items before deleting
        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: { items: true }
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Verify organization ownership
        if (order.organizationId !== user.organizationId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Restore stock for all items in the order
        for (const item of order.items) {
            if (item.productId) {
                try {
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId }
                    });

                    if (product) {
                        const restoredStock = product.stock + item.quantity;
                        const newStatus = restoredStock <= 0 ? 'OUT_OF_STOCK' :
                                        restoredStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK';

                        await prisma.product.update({
                            where: { id: product.id },
                            data: {
                                stock: restoredStock,
                                status: newStatus
                            }
                        });

                        // Create stock adjustment record
                        await prisma.stockAdjustment.create({
                            data: {
                                productId: product.id,
                                quantity: item.quantity,  // Positive for restoration
                                previousStock: product.stock,
                                newStock: restoredStock,
                                reason: "Order Cancelled/Deleted",
                                notes: `Order ${order.orderId} deleted - restored ${item.quantity} units`,
                                adjustedBy: user.name || "System"
                            }
                        });
                    }
                } catch (itemError) {
                    console.error(`Error restoring stock for item ${item.sku}:`, itemError);
                    // Continue with other items
                }
            }
        }

        // Delete the order and its items in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete related order items first
            await tx.orderItem.deleteMany({
                where: { orderId: parseInt(id) }
            });

            // Then delete the order
            await tx.order.delete({
                where: { id: parseInt(id) }
            });
        });

        return NextResponse.json({
            message: 'Order deleted successfully and stock restored',
            restoredItems: order.items.length
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json(
            { error: 'Failed to delete order: ' + error.message },
            { status: 500 }
        );
    }
})