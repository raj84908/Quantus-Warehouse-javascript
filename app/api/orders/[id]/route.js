import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: {
                status: body.status,
                updatedAt: new Date()
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