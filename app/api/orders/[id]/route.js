import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

export const PATCH = withAuth(async (request, { params, user }) => {
    try {
        const { id } = params;
        const body = await request.json();

        // Wrap entire operation in a transaction for atomicity
        const updatedOrder = await prisma.$transaction(async (tx) => {
            // Get the existing order with items
            const existingOrder = await tx.order.findUnique({
                where: { id: parseInt(id) },
                include: { items: true }
            });

            if (!existingOrder) {
                throw new Error("Order not found");
            }

            // Verify organization ownership
            if (existingOrder.organizationId !== user.organizationId) {
                throw new Error("Unauthorized");
            }

            // If items are being updated, handle stock adjustments
            if (body.items) {
                // Step 1: Restore stock for old items
                for (const oldItem of existingOrder.items) {
                    if (oldItem.productId) {
                        const product = await tx.product.findUnique({
                            where: { id: oldItem.productId }
                        });

                        if (product) {
                            const restoredStock = product.stock + oldItem.quantity;
                            const newStatus = restoredStock <= 0 ? 'OUT_OF_STOCK' :
                                            restoredStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK';

                            await tx.product.update({
                                where: { id: product.id },
                                data: {
                                    stock: restoredStock,
                                    status: newStatus
                                }
                            });

                            // Create stock adjustment record for restoration
                            await tx.stockAdjustment.create({
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
                await tx.orderItem.deleteMany({
                    where: { orderId: parseInt(id) }
                });

                // Step 3: Deduct stock for new items
                for (const newItem of body.items) {
                    if (newItem.productId) {
                        const product = await tx.product.findUnique({
                            where: { id: newItem.productId }
                        });

                        if (product) {
                            const newStock = Math.max(0, product.stock - newItem.quantity);
                            const newStatus = newStock <= 0 ? 'OUT_OF_STOCK' :
                                            newStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK';

                            await tx.product.update({
                                where: { id: product.id },
                                data: {
                                    stock: newStock,
                                    status: newStatus
                                }
                            });

                            // Create stock adjustment record for deduction
                            await tx.stockAdjustment.create({
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
            const updated = await tx.order.update({
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

            return updated;
        });

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error(`Error updating order ${params.id}:`, error);

        if (error.message === "Order not found") {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

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

        // Wrap entire delete operation in transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Get the order with items before deleting
            const order = await tx.order.findUnique({
                where: { id: parseInt(id) },
                include: { items: true }
            });

            if (!order) {
                throw new Error('Order not found');
            }

            // Verify organization ownership
            if (order.organizationId !== user.organizationId) {
                throw new Error('Unauthorized');
            }

            // Restore stock for all items in the order
            for (const item of order.items) {
                if (item.productId) {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId }
                    });

                    if (product) {
                        const restoredStock = product.stock + item.quantity;
                        const newStatus = restoredStock <= 0 ? 'OUT_OF_STOCK' :
                                        restoredStock <= product.minStock ? 'LOW_STOCK' : 'IN_STOCK';

                        await tx.product.update({
                            where: { id: product.id },
                            data: {
                                stock: restoredStock,
                                status: newStatus
                            }
                        });

                        // Create stock adjustment record
                        await tx.stockAdjustment.create({
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
                }
            }

            // Delete related order items first
            await tx.orderItem.deleteMany({
                where: { orderId: parseInt(id) }
            });

            // Then delete the order
            await tx.order.delete({
                where: { id: parseInt(id) }
            });

            return { itemsRestored: order.items.length };
        });

        return NextResponse.json({
            message: 'Order deleted successfully and stock restored',
            restoredItems: result.itemsRestored
        });
    } catch (error) {
        console.error('Error deleting order:', error);

        if (error.message === 'Order not found') {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(
            { error: 'Failed to delete order: ' + error.message },
            { status: 500 }
        );
    }
})