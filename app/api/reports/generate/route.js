import { NextResponse } from "next/server"
import { withAuth } from '@/lib/auth'
import {
    generateReportData,
    formatAsHTML,
    formatAsCSV,
    saveReport,
    REPORT_TYPES,
    EXPORT_FORMATS
} from '@/lib/reportGenerator'

// POST generate report
export const POST = withAuth(async (request, { user }) => {
    try {
        const body = await request.json();
        const {
            type,
            timeRange,
            format = 'HTML',
            startDate: customStartDate,
            endDate: customEndDate,
            filters = {}
        } = body;

        // Validate inputs
        if (!type) {
            return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
        }

        // Calculate date range
        let startDate, endDate;

        if (customStartDate && customEndDate) {
            // Custom date range provided
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
            }

            if (startDate > endDate) {
                return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
            }
        } else if (timeRange) {
            // Use timeRange (days)
            const days = parseInt(timeRange);

            if (isNaN(days) || days <= 0) {
                return NextResponse.json({ error: 'Invalid time range' }, { status: 400 });
            }

            endDate = new Date();
            startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
        } else {
            // Default to last 30 days
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        }

        // Generate report data using the new utility
        const reportData = await generateReportData(type, {
            startDate,
            endDate,
            organizationId: user.organizationId,
            customFilters: filters
        });

        // Calculate timeRange for display (days between start and end)
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        // Format report based on export format
        let reportContent;
        let contentType;
        let fileExtension;

        switch (format) {
            case EXPORT_FORMATS.CSV:
                reportContent = formatAsCSV(reportData);
                contentType = 'text/csv';
                fileExtension = 'csv';
                break;

            case EXPORT_FORMATS.HTML:
            default:
                reportContent = formatAsHTML(reportData, type, daysDiff);
                contentType = 'text/html';
                fileExtension = 'html';
                break;
        }

        // Save report to database
        try {
            await saveReport(reportData, {
                organizationId: user.organizationId,
                reportType: type,
                format,
                timeRange: daysDiff,
                content: reportContent,
                saveToFile: true
            });
        } catch (saveError) {
            console.error('Error saving report to database:', saveError);
            // Continue even if saving fails - user still gets the report
        }

        // Generate filename
        const fileName = `${type.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${fileExtension}`;

        // Return file for download
        return new NextResponse(reportContent, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileName}"`
            }
        });

    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json(
            {
                error: 'Failed to generate report',
                message: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
})
