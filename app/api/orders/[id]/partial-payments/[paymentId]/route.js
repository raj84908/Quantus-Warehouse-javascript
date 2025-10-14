import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

export const DELETE = withAuth(async (request, { params, user }) => {
    try {
        const paymentId = parseInt(params.paymentId)

        if (isNaN(paymentId)) {
            return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 })
        }

        // First, get the payment and verify it belongs to an order in this organization
        const payment = await prisma.partialPayment.findUnique({
            where: { id: paymentId },
            include: {
                order: true
            }
        })

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
        }

        // Verify the order belongs to user's organization
        if (payment.order.organizationId !== user.organizationId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        await prisma.partialPayment.delete({
            where: { id: paymentId }
        })

        return NextResponse.json({ message: 'Payment deleted successfully' })
    } catch (error) {
        console.error('Error deleting payment:', error)
        return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
    }
})