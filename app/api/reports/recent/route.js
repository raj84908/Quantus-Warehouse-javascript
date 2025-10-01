import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'

export async function GET(request) {
    try {
        const recentReports = await prisma.report.findMany({
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
}
