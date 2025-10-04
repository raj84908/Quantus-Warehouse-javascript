import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();

        // Delete existing items if items are provided
        if (body.items) {
            await prisma.orderItem.deleteMany({
                where: { orderId: parseInt(id) }
            });
        }

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
}



// Get a specific order by ID
export async function GET(_, { params }) {
    try {
        const { id } = params;

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
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
}

// DELETE /api/orders/:id
export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        console.log('Deleting order with ID:', id);

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

        return NextResponse.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        return NextResponse.json(
            { error: 'Failed to delete order: ' + error.message },
            { status: 500 }
        );
    }
}