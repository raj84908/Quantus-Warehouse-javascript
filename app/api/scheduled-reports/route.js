import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// GET all scheduled reports for organization
export const GET = withAuth(async (request, { user }) => {
    try {
        const scheduledReports = await prisma.scheduledReport.findMany({
            where: {
                organizationId: user.organizationId
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(scheduledReports)
    } catch (error) {
        console.error('Error fetching scheduled reports:', error)
        return NextResponse.json(
            { error: 'Failed to fetch scheduled reports' },
            { status: 500 }
        )
    }
})

// POST create new scheduled report
export const POST = withAuth(async (request, { user }) => {
    try {
        const body = await request.json()
        const {
            name,
            reportType,
            frequency,
            format,
            timeRange,
            emailRecipients
        } = body

        // Validate required fields
        if (!name || !reportType || !frequency || !format || !timeRange) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Calculate next run time based on frequency
        const now = new Date()
        let nextRunAt = new Date(now)

        switch (frequency) {
            case 'DAILY':
                nextRunAt.setDate(nextRunAt.getDate() + 1)
                nextRunAt.setHours(8, 0, 0, 0) // 8 AM next day
                break
            case 'WEEKLY':
                nextRunAt.setDate(nextRunAt.getDate() + 7)
                nextRunAt.setHours(8, 0, 0, 0) // 8 AM next week
                break
            case 'MONTHLY':
                nextRunAt.setMonth(nextRunAt.getMonth() + 1)
                nextRunAt.setDate(1)
                nextRunAt.setHours(8, 0, 0, 0) // 8 AM 1st of next month
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid frequency' },
                    { status: 400 }
                )
        }

        const scheduledReport = await prisma.scheduledReport.create({
            data: {
                organizationId: user.organizationId,
                name,
                reportType,
                frequency,
                format,
                timeRange: parseInt(timeRange),
                emailRecipients: emailRecipients || null,
                createdBy: user.email,
                nextRunAt,
                isActive: true
            }
        })

        return NextResponse.json(scheduledReport, { status: 201 })
    } catch (error) {
        console.error('Error creating scheduled report:', error)
        return NextResponse.json(
            { error: 'Failed to create scheduled report' },
            { status: 500 }
        )
    }
})