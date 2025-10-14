import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// POST /api/orders/[id]/partial-payments
export const POST = withAuth(async (request, { params, user }) => {
    try {
        const orderId = parseInt(params.id)

        if (isNaN(orderId)) {
            return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
        }

        const body = await request.json()

        if (!body.amount || body.amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }

        // Verify order exists AND belongs to user's organization
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                organizationId: user.organizationId
            },
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

        // Create payment with new fields
        const payment = await prisma.partialPayment.create({
            data: {
                orderId,
                amount: body.amount,
                paymentMethod: body.paymentMethod || 'Cash',
                paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
                notes: body.notes || null,
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
})

// GET /api/orders/[id]/partial-payments
export const GET = withAuth(async (request, { params, user }) => {
    try {
        const orderId = parseInt(params.id)

        if (isNaN(orderId)) {
            return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
        }

        // Verify order belongs to user's organization
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                organizationId: user.organizationId
            }
        })

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
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
})