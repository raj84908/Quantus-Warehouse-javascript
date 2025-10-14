import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

// DELETE /api/reports/[id]
export const DELETE = withAuth(async (request, { params, user }) => {
    try {
        const reportId = parseInt(params.id)

        if (isNaN(reportId)) {
            return NextResponse.json(
                { error: 'Invalid report ID' },
                { status: 400 }
            )
        }

        // Find report - ensure it belongs to user's organization
        const report = await prisma.report.findFirst({
            where: {
                id: reportId,
                organizationId: user.organizationId
            }
        })

        if (!report) {
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            )
        }

        // Delete file from filesystem if it exists
        if (report.filePath) {
            const filePath = path.join(process.cwd(), 'reports', report.filePath)
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath)
                } catch (fileError) {
                    console.error('Error deleting report file:', fileError)
                    // Continue with database deletion even if file deletion fails
                }
            }
        }

        // Delete from database
        await prisma.report.delete({
            where: { id: reportId }
        })

        return NextResponse.json({
            success: true,
            message: 'Report deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting report:', error)
        return NextResponse.json(
            { error: 'Failed to delete report' },
            { status: 500 }
        )
    }
})
