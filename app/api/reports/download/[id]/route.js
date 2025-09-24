import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// GET download report by ID
export async function GET(request, { params }) {
    try {
        const { id } = params

        // Find the report in database
        const report = await prisma.report.findUnique({
            where: {
                id: parseInt(id)
            }
        })

        if (!report) {
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            )
        }

        // Get the file path
        const filePath = path.join(process.cwd(), 'public', report.filePath)

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: 'Report file not found' },
                { status: 404 }
            )
        }

        // Read the file
        const fileContent = fs.readFileSync(filePath)

        // Determine content type based on actual file extension
        const fileExtension = path.extname(filePath).toLowerCase()
        const contentType = fileExtension === '.pdf' ? 'application/pdf' :
            fileExtension === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                fileExtension === '.csv' ? 'text/csv' :
                    'text/html'

        const fileName = `${report.name.toLowerCase().replace(/\s+/g, '_')}_${report.id}${fileExtension}`

        return new NextResponse(fileContent, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': report.size.toString()
            }
        })

    } catch (error) {
        console.error('Error downloading report:', error)
        return NextResponse.json(
            { error: 'Failed to download report' },
            { status: 500 }
        )
    }
}