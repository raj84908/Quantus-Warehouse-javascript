import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

export const GET = withAuth(async (request, { user }) => {
    try {
        const recentReports = await prisma.report.findMany({
            where: {
                organizationId: user.organizationId
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })

        return NextResponse.json(recentReports)
    } catch (error) {
        console.error('Error fetching recent reports:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recent reports' },
            { status: 500 }
        )
    }
})
