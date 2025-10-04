import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

export async function DELETE(request, { params }) {
    try {
        const paymentId = parseInt(params.paymentId)

        await prisma.partialPayment.delete({
            where: { id: paymentId }
        })

        return NextResponse.json({ message: 'Payment deleted' })
    } catch (error) {
        console.error('Error deleting payment:', error)
        return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
    }
}