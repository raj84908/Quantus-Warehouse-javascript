import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// DELETE scheduled report
export const DELETE = withAuth(async (request, { params, user }) => {
    try {
        const scheduleId = parseInt(params.id)

        if (isNaN(scheduleId)) {
            return NextResponse.json(
                { error: 'Invalid schedule ID' },
                { status: 400 }
            )
        }

        // Verify it belongs to user's organization
        const schedule = await prisma.scheduledReport.findFirst({
            where: {
                id: scheduleId,
                organizationId: user.organizationId
            }
        })

        if (!schedule) {
            return NextResponse.json(
                { error: 'Scheduled report not found' },
                { status: 404 }
            )
        }

        await prisma.scheduledReport.delete({
            where: { id: scheduleId }
        })

        return NextResponse.json({
            success: true,
            message: 'Scheduled report deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting scheduled report:', error)
        return NextResponse.json(
            { error: 'Failed to delete scheduled report' },
            { status: 500 }
        )
    }
})

// PATCH toggle scheduled report active status
export const PATCH = withAuth(async (request, { params, user }) => {
    try {
        const scheduleId = parseInt(params.id)
        const body = await request.json()
        const { isActive } = body

        if (isNaN(scheduleId)) {
            return NextResponse.json(
                { error: 'Invalid schedule ID' },
                { status: 400 }
            )
        }

        // Verify it belongs to user's organization
        const schedule = await prisma.scheduledReport.findFirst({
            where: {
                id: scheduleId,
                organizationId: user.organizationId
            }
        })

        if (!schedule) {
            return NextResponse.json(
                { error: 'Scheduled report not found' },
                { status: 404 }
            )
        }

        const updated = await prisma.scheduledReport.update({
            where: { id: scheduleId },
            data: { isActive }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating scheduled report:', error)
        return NextResponse.json(
            { error: 'Failed to update scheduled report' },
            { status: 500 }
        )
    }
})