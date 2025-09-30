import { NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// POST generate report
export async function POST(request) {
    try {
        const { type, timeRange, format } = await request.json()
        const days = parseInt(timeRange)

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        let reportData = {}
        let reportName = type
        let category = getReportCategory(type)

        // Generate different reports based on type
        switch (type) {
            case 'Inventory Summary':
                reportData = await generateInventoryReport(startDate)
                break
            case 'Sales Performance':
                reportData = await generateSalesReport(startDate)
                break
            case 'Order Fulfillment':
                reportData = await generateOrderReport(startDate)
                break
            case 'Low Stock Alert':
                reportData = await generateLowStockReport()
                break
            case 'Financial Summary':
                reportData = await generateFinancialReport(startDate)
                break
            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
        }

        // Generate the actual report file
        const reportContent = generateReportHTML(reportData, reportName, timeRange)

        // Create reports directory if it doesn't exist
        const reportsDir = path.join(process.cwd(), 'public', 'reports')
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true })
        }

        // Save report to file
        const fileExtension = format === 'PDF' ? 'html' : format.toLowerCase() // Still HTML for now
        const fileName = `${reportName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${fileExtension}`
        const filePath = path.join(reportsDir, fileName)
        const publicPath = `/reports/${fileName}`

        fs.writeFileSync(filePath, reportContent)

        // Get file size
        const stats = fs.statSync(filePath)
        const fileSize = stats.size

        // Save report record to database
        const report = await prisma.report.create({
            data: {
                name: reportName,
                description: getReportDescription(type),
                category,
                format,
                filePath: publicPath,
                size: fileSize,
                timeRange
            }
        })

        // Return the HTML content as PDF-like response
        return new NextResponse(reportContent, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `attachment; filename="${fileName}"`
            }
        })

    } catch (error) {
        console.error('Error generating report:', error)
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        )
    }
}

// Helper functions
function getReportCategory(type) {
    if (type.includes('Inventory') || type.includes('Stock')) return 'Inventory'
    if (type.includes('Sales') || type.includes('Financial')) return 'Sales'
    if (type.includes('Order') || type.includes('Fulfillment')) return 'Operations'
    return 'General'
}

function getReportDescription(type) {
    const descriptions = {
        'Inventory Summary': 'Complete overview of current stock levels and values',
        'Sales Performance': 'Sales analysis and revenue breakdown',
        'Order Fulfillment': 'Order processing times and fulfillment metrics',
        'Low Stock Alert': 'Products requiring immediate attention',
        'Financial Summary': 'Revenue and financial performance overview'
    }
    return descriptions[type] || 'Warehouse report'
}

async function generateInventoryReport(startDate) {
    const products = await prisma.product.findMany({
        include: {
            category: true
        }
    })

    const totalValue = products.reduce((sum, product) => sum + (product.value * product.stock), 0)
    const lowStockCount = products.filter(p => p.status === 'LOW_STOCK' || p.status === 'OUT_OF_STOCK').length

    return {
        title: 'Inventory Summary Report',
        totalProducts: products.length,
        totalValue,
        lowStockCount,
        products: products.slice(0, 20) // Top 20 for the report
    }
}

async function generateSalesReport(startDate) {
    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDate }
        },
        include: {
            items: true
        }
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const completedOrders = orders.filter(o => o.status === 'Completed').length

    return {
        title: 'Sales Performance Report',
        totalOrders: orders.length,
        totalRevenue,
        completedOrders,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        orders: orders.slice(0, 10)
    }
}

async function generateOrderReport(startDate) {
    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDate }
        }
    })

    const completedOrders = orders.filter(o => o.status === 'Completed')
    const avgFulfillmentTime = completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => {
        const diff = order.updatedAt.getTime() - order.createdAt.getTime()
        return sum + (diff / (1000 * 60 * 60 * 24))
    }, 0) / completedOrders.length
        : 0

    return {
        title: 'Order Fulfillment Report',
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        processingOrders: orders.filter(o => o.status === 'Processing').length,
        avgFulfillmentTime,
        orders: orders.slice(0, 15)
    }
}

async function generateLowStockReport() {
    const lowStockProducts = await prisma.product.findMany({
        where: {
            OR: [
                { status: 'LOW_STOCK' },
                { status: 'OUT_OF_STOCK' }
            ]
        },
        include: {
            category: true
        }
    })

    return {
        title: 'Low Stock Alert Report',
        totalLowStock: lowStockProducts.length,
        outOfStock: lowStockProducts.filter(p => p.status === 'OUT_OF_STOCK').length,
        lowStock: lowStockProducts.filter(p => p.status === 'LOW_STOCK').length,
        products: lowStockProducts
    }
}

async function generateFinancialReport(startDate) {
    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDate }
        }
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0)

    const products = await prisma.product.findMany()
    const totalInventoryValue = products.reduce((sum, product) => sum + (product.value * product.stock), 0)

    return {
        title: 'Financial Summary Report',
        totalRevenue,
        totalSubtotal,
        totalInventoryValue,
        orderCount: orders.length,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
    }
}

function generateReportHTML(data, reportName, timeRange) {
    const currentDate = new Date().toLocaleDateString()

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${reportName}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #3b82f6; margin: 0; }
            .meta-info { color: #666; margin-top: 10px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .stat-label { color: #6b7280; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${data.title}</h1>
            <div class="meta-info">
                Generated on: ${currentDate} | Time Range: Last ${timeRange} days
            </div>
        </div>

        ${generateReportContent(data)}

        <div class="footer">
            <p>This report was automatically generated by Quantus Warehouse Management System.</p>
            <p>For questions about this report, please contact your system administrator.</p>
        </div>
    </body>
    </html>
    `
}

function generateReportContent(data) {
    // Generate different content based on the report type
    if (data.title.includes('Inventory')) {
        return `
            <div class="section">
                <h2>Inventory Overview</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.totalProducts}</div>
                        <div class="stat-label">Total Products</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.totalValue?.toLocaleString() || 0}</div>
                        <div class="stat-label">Total Inventory Value</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.lowStockCount}</div>
                        <div class="stat-label">Low Stock Items</div>
                    </div>
                </div>
                
                <h3>Product Details</h3>
                <table>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Stock</th>
                            <th>Min Stock</th>
                            <th>Status</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.products?.map(product => `
                            <tr>
                                <td>${product.sku}</td>
                                <td>${product.name}</td>
                                <td>${product.category?.name || 'N/A'}</td>
                                <td>${product.stock}</td>
                                <td>${product.minStock}</td>
                                <td>${product.status}</td>
                                <td>${(product.value * product.stock).toFixed(2)}</td>
                            </tr>
                        `).join('') || ''}
                    </tbody>
                </table>
            </div>
        `
    }

    if (data.title.includes('Sales')) {
        return `
            <div class="section">
                <h2>Sales Performance Overview</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.totalOrders}</div>
                        <div class="stat-label">Total Orders</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.totalRevenue?.toLocaleString() || 0}</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.completedOrders}</div>
                        <div class="stat-label">Completed Orders</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.averageOrderValue?.toFixed(2) || 0}</div>
                        <div class="stat-label">Average Order Value</div>
                    </div>
                </div>
                
                <h3>Recent Orders</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.orders?.map(order => `
                            <tr>
                                <td>${order.orderId}</td>
                                <td>${order.customer}</td>
                                <td>${order.total?.toFixed(2)}</td>
                                <td>${order.status}</td>
                                <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                        `).join('') || ''}
                    </tbody>
                </table>
            </div>
        `
    }

    if (data.title.includes('Order Fulfillment')) {
        return `
            <div class="section">
                <h2>Order Fulfillment Metrics</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.totalOrders}</div>
                        <div class="stat-label">Total Orders</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.completedOrders}</div>
                        <div class="stat-label">Completed Orders</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.processingOrders}</div>
                        <div class="stat-label">Processing Orders</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.avgFulfillmentTime?.toFixed(1) || 0} days</div>
                        <div class="stat-label">Avg Fulfillment Time</div>
                    </div>
                </div>
                
                <h3>Order Status Breakdown</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Due Date</th>
                            <th>Assigned To</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.orders?.map(order => `
                            <tr>
                                <td>${order.orderId}</td>
                                <td>${order.customer}</td>
                                <td>${order.status}</td>
                                <td>${order.priority}</td>
                                <td>${order.dueDate}</td>
                                <td>${order.assignedTo}</td>
                            </tr>
                        `).join('') || ''}
                    </tbody>
                </table>
            </div>
        `
    }

    if (data.title.includes('Low Stock')) {
        return `
            <div class="section">
                <h2>Low Stock Alert Summary</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.totalLowStock}</div>
                        <div class="stat-label">Total Low Stock Items</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.outOfStock}</div>
                        <div class="stat-label">Out of Stock</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.lowStock}</div>
                        <div class="stat-label">Low Stock</div>
                    </div>
                </div>
                
                <h3>Items Requiring Attention</h3>
                <table>
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Current Stock</th>
                            <th>Min Stock</th>
                            <th>Status</th>
                            <th>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.products?.map(product => `
                            <tr style="${product.status === 'OUT_OF_STOCK' ? 'background-color: #fee2e2;' : 'background-color: #fef3c7;'}">
                                <td>${product.sku}</td>
                                <td>${product.name}</td>
                                <td>${product.category?.name || 'N/A'}</td>
                                <td>${product.stock}</td>
                                <td>${product.minStock}</td>
                                <td>${product.status}</td>
                                <td>${product.location}</td>
                            </tr>
                        `).join('') || ''}
                    </tbody>
                </table>
            </div>
        `
    }

    if (data.title.includes('Financial')) {
        return `
            <div class="section">
                <h2>Financial Summary</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.totalRevenue?.toLocaleString() || 0}</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.totalSubtotal?.toLocaleString() || 0}</div>
                        <div class="stat-label">Subtotal</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.totalInventoryValue?.toLocaleString() || 0}</div>
                        <div class="stat-label">Inventory Value</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${data.orderCount}</div>
                        <div class="stat-label">Total Orders</div>
                    </div>
                </div>
                
                <h3>Key Metrics</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Average Order Value</td>
                            <td>${data.averageOrderValue?.toFixed(2) || 0}</td>
                        </tr>
                        <tr>
                            <td>Total Revenue</td>
                            <td>${data.totalRevenue?.toLocaleString() || 0}</td>
                        </tr>
                        <tr>
                            <td>Total Inventory Value</td>
                            <td>${data.totalInventoryValue?.toLocaleString() || 0}</td>
                        </tr>
                        <tr>
                            <td>Revenue per Order</td>
                            <td>${(data.totalRevenue / data.orderCount || 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `
    }

    return '<div class="section"><p>Report data not available</p></div>'
}