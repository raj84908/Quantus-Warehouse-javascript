import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// POST /api/orders/[id]/partial-payments
export async function POST(request, { params }) {
    try {
        const orderId = parseInt(params.id)

        if (isNaN(orderId)) {
            return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
        }

        const body = await request.json()

        if (!body.amount || body.amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }

        // Verify order exists
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { partialPayments: true }
        })

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        // Calculate remaining balance
        const totalPaid = order.partialPayments.reduce((sum, p) => sum + p.amount, 0)
        const remainingBalance = order.total - totalPaid

        if (body.amount > remainingBalance) {
            return NextResponse.json({
                error: "Payment amount exceeds remaining balance",
                remainingBalance
            }, { status: 400 })
        }

        const payment = await prisma.partialPayment.create({
            data: {
                orderId,
                amount: body.amount,
            }
        })

        return NextResponse.json(payment, { status: 201 })
    } catch (error) {
        console.error('Error recording partial payment:', error)
        return NextResponse.json({
            error: "Failed to record partial payment",
            details: error.message
        }, { status: 500 })
    }
}

// GET /api/orders/[id]/partial-payments
export async function GET(request, { params }) {
    try {
        const orderId = parseInt(params.id)

        if (isNaN(orderId)) {
            return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
        }

        const payments = await prisma.partialPayment.findMany({
            where: { orderId },
            orderBy: { paidAt: "desc" },
        })

        return NextResponse.json(payments)
    } catch (error) {
        console.error('Error fetching partial payments:', error)
        return NextResponse.json({
            error: "Failed to fetch partial payments"
        }, { status: 500 })
    }
}