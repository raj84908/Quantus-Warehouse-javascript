import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

// GET /api/orders/:orderId/partial-payments
export async function GET(request, { params }) {
    const { orderId } = params
    try {
        const payments = await prisma.partialPayment.findMany({
            where: { orderId: Number(orderId) },
            orderBy: { paidAt: "desc" },
        })
        return NextResponse.json(payments)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch partial payments" }, { status: 500 })
    }
}

// POST /api/orders/:orderId/partial-payments
export async function POST(request, { params }) {
    const { orderId } = params
    try {
        const body = await request.json()
        if (!body.amount || body.amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
        }

        // Optional: Validate amount does not exceed order balance here

        const payment = await prisma.partialPayment.create({
            data: {
                orderId: Number(orderId),
                amount: body.amount,
            }
        })

        return NextResponse.json(payment, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to record partial payment" }, { status: 500 })
    }
}
