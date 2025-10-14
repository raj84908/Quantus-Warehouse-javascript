import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

// GET /api/reports/download/[id]
export const GET = withAuth(async (request, { params, user }) => {
    try {
        const reportId = parseInt(params.id)

        if (isNaN(reportId)) {
            return NextResponse.json(
                { error: 'Invalid report ID' },
                { status: 400 }
            )
        }

        // Fetch report from database - ensure it belongs to user's organization
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

        // Check if file exists
        const filePath = path.join(process.cwd(), 'reports', report.filePath)

        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: 'Report file not found on server' },
                { status: 404 }
            )
        }

        // Read file
        const fileBuffer = fs.readFileSync(filePath)

        // Determine content type based on format
        const contentType = report.format === 'PDF' ? 'application/pdf' :
                           report.format === 'EXCEL' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                           report.format === 'CSV' ? 'text/csv' :
                           'text/html'

        // Return file
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${report.name}"`
            }
        })
    } catch (error) {
        console.error('Error downloading report:', error)
        return NextResponse.json(
            { error: 'Failed to download report' },
            { status: 500 }
        )
    }
})
