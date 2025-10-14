import { prisma } from './prisma'
import fs from 'fs'
import path from 'path'

/**
 * Report Generator Utility
 * Handles all report generation logic including data fetching, formatting, and file creation
 */

// Report type configurations
export const REPORT_TYPES = {
    INVENTORY_SUMMARY: 'Inventory Summary',
    SALES_PERFORMANCE: 'Sales Performance',
    ORDER_FULFILLMENT: 'Order Fulfillment',
    LOW_STOCK_ALERT: 'Low Stock Alert',
    FINANCIAL_SUMMARY: 'Financial Summary'
}

export const EXPORT_FORMATS = {
    HTML: 'HTML',
    CSV: 'CSV',
    EXCEL: 'EXCEL'
}

/**
 * Get report category from report type
 */
export function getReportCategory(type) {
    if (type.includes('Inventory') || type.includes('Stock')) return 'Inventory'
    if (type.includes('Sales') || type.includes('Financial')) return 'Sales'
    if (type.includes('Order') || type.includes('Fulfillment')) return 'Operations'
    return 'General'
}

/**
 * Generate report data based on type
 */
export async function generateReportData(type, options = {}) {
    const { startDate, endDate, organizationId, customFilters = {} } = options

    switch (type) {
        case REPORT_TYPES.INVENTORY_SUMMARY:
            return await generateInventoryData(organizationId, customFilters)
        case REPORT_TYPES.SALES_PERFORMANCE:
            return await generateSalesData(startDate, endDate, organizationId, customFilters)
        case REPORT_TYPES.ORDER_FULFILLMENT:
            return await generateOrderData(startDate, endDate, organizationId, customFilters)
        case REPORT_TYPES.LOW_STOCK_ALERT:
            return await generateLowStockData(organizationId, customFilters)
        case REPORT_TYPES.FINANCIAL_SUMMARY:
            return await generateFinancialData(startDate, endDate, organizationId, customFilters)
        default:
            throw new Error(`Unknown report type: ${type}`)
    }
}

/**
 * Generate inventory report data
 */
async function generateInventoryData(organizationId, filters = {}) {
    const whereClause = {
        organizationId,
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.location && { location: { contains: filters.location, mode: 'insensitive' } })
    }

    const products = await prisma.product.findMany({
        where: whereClause,
        include: {
            category: true
        },
        orderBy: filters.sortBy ? { [filters.sortBy]: filters.sortOrder || 'asc' } : { name: 'asc' }
    })

    const totalValue = products.reduce((sum, product) => sum + (product.value * product.stock), 0)
    const lowStockCount = products.filter(p => p.status === 'LOW_STOCK' || p.status === 'OUT_OF_STOCK').length

    return {
        title: 'Inventory Summary Report',
        totalProducts: products.length,
        totalValue,
        lowStockCount,
        products,
        summary: {
            inStock: products.filter(p => p.status === 'IN_STOCK').length,
            lowStock: products.filter(p => p.status === 'LOW_STOCK').length,
            outOfStock: products.filter(p => p.status === 'OUT_OF_STOCK').length
        }
    }
}

/**
 * Generate sales report data
 */
async function generateSalesData(startDate, endDate, organizationId, filters = {}) {
    const dateFilter = {}
    if (startDate && endDate) {
        dateFilter.createdAt = { gte: startDate, lte: endDate }
    } else if (startDate) {
        dateFilter.createdAt = { gte: startDate }
    }

    const orders = await prisma.order.findMany({
        where: {
            organizationId,
            ...dateFilter,
            ...(filters.status && { status: filters.status })
        },
        include: {
            items: true
        },
        orderBy: { createdAt: 'desc' }
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const completedOrders = orders.filter(o => o.status === 'Completed').length

    return {
        title: 'Sales Performance Report',
        totalOrders: orders.length,
        totalRevenue,
        completedOrders,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        orders,
        periodComparison: await calculatePeriodComparison(startDate, endDate, organizationId)
    }
}

/**
 * Generate order fulfillment report data
 */
async function generateOrderData(startDate, endDate, organizationId, filters = {}) {
    const dateFilter = {}
    if (startDate && endDate) {
        dateFilter.createdAt = { gte: startDate, lte: endDate }
    } else if (startDate) {
        dateFilter.createdAt = { gte: startDate }
    }

    const orders = await prisma.order.findMany({
        where: {
            organizationId,
            ...dateFilter
        },
        orderBy: { createdAt: 'desc' }
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
        pendingOrders: orders.filter(o => o.status === 'Pending').length,
        avgFulfillmentTime,
        orders
    }
}

/**
 * Generate low stock report data
 */
async function generateLowStockData(organizationId, filters = {}) {
    const lowStockProducts = await prisma.product.findMany({
        where: {
            organizationId,
            OR: [
                { status: 'LOW_STOCK' },
                { status: 'OUT_OF_STOCK' }
            ]
        },
        include: {
            category: true
        },
        orderBy: { stock: 'asc' }
    })

    return {
        title: 'Low Stock Alert Report',
        totalLowStock: lowStockProducts.length,
        outOfStock: lowStockProducts.filter(p => p.status === 'OUT_OF_STOCK').length,
        lowStock: lowStockProducts.filter(p => p.status === 'LOW_STOCK').length,
        products: lowStockProducts,
        estimatedRestockValue: lowStockProducts.reduce((sum, p) => sum + (p.minStock - p.stock) * p.value, 0)
    }
}

/**
 * Generate financial report data
 */
async function generateFinancialData(startDate, endDate, organizationId, filters = {}) {
    const dateFilter = {}
    if (startDate && endDate) {
        dateFilter.createdAt = { gte: startDate, lte: endDate }
    } else if (startDate) {
        dateFilter.createdAt = { gte: startDate }
    }

    const orders = await prisma.order.findMany({
        where: {
            organizationId,
            ...dateFilter
        }
    })

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalSubtotal = orders.reduce((sum, order) => sum + order.subtotal, 0)

    const products = await prisma.product.findMany({
        where: { organizationId }
    })
    const totalInventoryValue = products.reduce((sum, product) => sum + (product.value * product.stock), 0)

    return {
        title: 'Financial Summary Report',
        totalRevenue,
        totalSubtotal,
        totalInventoryValue,
        orderCount: orders.length,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        totalTax: totalRevenue - totalSubtotal,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalSubtotal) / totalRevenue * 100).toFixed(2) : 0
    }
}

/**
 * Calculate period comparison (current vs previous period)
 */
async function calculatePeriodComparison(startDate, endDate, organizationId) {
    if (!startDate || !endDate) return null

    const currentPeriodMs = endDate.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - currentPeriodMs)
    const previousEndDate = new Date(startDate)

    const previousOrders = await prisma.order.findMany({
        where: {
            organizationId,
            createdAt: { gte: previousStartDate, lte: previousEndDate }
        }
    })

    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0)

    return {
        previousOrderCount: previousOrders.length,
        previousRevenue
    }
}

/**
 * Save report to database and optionally to file system
 */
export async function saveReport(reportData, options = {}) {
    const {
        organizationId,
        reportType,
        format,
        timeRange,
        content,
        saveToFile = true
    } = options

    let filePath = null
    let fileSize = 0

    if (saveToFile) {
        // Create reports directory if it doesn't exist
        const reportsDir = path.join(process.cwd(), 'reports', organizationId)
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true })
        }

        // Generate filename
        const timestamp = Date.now()
        const extension = format === 'HTML' ? 'html' : format === 'CSV' ? 'csv' : 'xlsx'
        const fileName = `${reportType.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.${extension}`
        filePath = path.join(organizationId, fileName)
        const fullPath = path.join(reportsDir, fileName)

        // Save file
        fs.writeFileSync(fullPath, content)
        fileSize = fs.statSync(fullPath).size
    }

    // Save to database
    const report = await prisma.report.create({
        data: {
            organizationId,
            name: `${reportType} - ${new Date().toLocaleDateString()}`,
            description: `Generated ${reportType} for ${timeRange} days`,
            category: getReportCategory(reportType),
            format,
            filePath: filePath || '',
            size: fileSize,
            timeRange: timeRange.toString()
        }
    })

    return report
}

/**
 * Format report as HTML
 */
export function formatAsHTML(data, reportName, timeRange) {
    const currentDate = new Date().toLocaleDateString()

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${reportName}</title>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #3b82f6; margin: 0; }
            .meta-info { color: #666; margin-top: 10px; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
            .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
            .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f9fafb; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
            .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; }
            @media print {
                .section { page-break-after: auto; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
            }
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

/**
 * Generate HTML content based on report type
 */
function generateReportContent(data) {
    if (data.title.includes('Inventory')) {
        return generateInventoryHTML(data)
    }
    if (data.title.includes('Sales')) {
        return generateSalesHTML(data)
    }
    if (data.title.includes('Order Fulfillment')) {
        return generateOrderFulfillmentHTML(data)
    }
    if (data.title.includes('Low Stock')) {
        return generateLowStockHTML(data)
    }
    if (data.title.includes('Financial')) {
        return generateFinancialHTML(data)
    }
    return '<div class="section"><p>Report data not available</p></div>'
}

function generateInventoryHTML(data) {
    return `
        <div class="section">
            <h2>Inventory Overview</h2>
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">${data.totalProducts}</div>
                    <div class="stat-label">Total Products</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${data.totalValue?.toLocaleString() || 0}</div>
                    <div class="stat-label">Total Inventory Value</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.lowStockCount}</div>
                    <div class="stat-label">Low Stock Items</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.summary?.inStock || 0}</div>
                    <div class="stat-label">In Stock</div>
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
                        <th>Unit Value</th>
                        <th>Total Value</th>
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
                            <td>$${product.value?.toFixed(2)}</td>
                            <td>$${(product.value * product.stock).toFixed(2)}</td>
                        </tr>
                    `).join('') || ''}
                </tbody>
            </table>
        </div>
    `
}

function generateSalesHTML(data) {
    const previousRevenue = data.periodComparison?.previousRevenue || 0
    const revenueChange = previousRevenue > 0
        ? ((data.totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
        : 0

    return `
        <div class="section">
            <h2>Sales Performance Overview</h2>
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">${data.totalOrders}</div>
                    <div class="stat-label">Total Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${data.totalRevenue?.toLocaleString() || 0}</div>
                    <div class="stat-label">Total Revenue ${revenueChange !== 0 ? `(${revenueChange > 0 ? '+' : ''}${revenueChange}%)` : ''}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.completedOrders}</div>
                    <div class="stat-label">Completed Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${data.averageOrderValue?.toFixed(2) || 0}</div>
                    <div class="stat-label">Average Order Value</div>
                </div>
            </div>

            <h3>Order Details</h3>
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.orders?.map(order => `
                        <tr>
                            <td>${order.orderId}</td>
                            <td>${order.customer}</td>
                            <td>$${order.total?.toFixed(2)}</td>
                            <td>${order.status}</td>
                            <td>${order.priority}</td>
                            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('') || ''}
                </tbody>
            </table>
        </div>
    `
}

function generateOrderFulfillmentHTML(data) {
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

function generateLowStockHTML(data) {
    return `
        <div class="section">
            <h2>Low Stock Alert Summary</h2>
            ${data.totalLowStock > 0 ? `
                <div class="alert">
                    <strong>Attention Required:</strong> ${data.totalLowStock} products need restocking.
                    Estimated restock value: $${data.estimatedRestockValue?.toFixed(2) || 0}
                </div>
            ` : ''}
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
                <div class="stat-card">
                    <div class="stat-value">$${data.estimatedRestockValue?.toFixed(0) || 0}</div>
                    <div class="stat-label">Estimated Restock Cost</div>
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
                        <th>Restock Qty</th>
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
                            <td>${product.minStock - product.stock}</td>
                        </tr>
                    `).join('') || ''}
                </tbody>
            </table>
        </div>
    `
}

function generateFinancialHTML(data) {
    return `
        <div class="section">
            <h2>Financial Summary</h2>
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-value">$${data.totalRevenue?.toLocaleString() || 0}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${data.totalSubtotal?.toLocaleString() || 0}</div>
                    <div class="stat-label">Subtotal</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${data.totalInventoryValue?.toLocaleString() || 0}</div>
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
                        <td>$${data.averageOrderValue?.toFixed(2) || 0}</td>
                    </tr>
                    <tr>
                        <td>Total Revenue</td>
                        <td>$${data.totalRevenue?.toLocaleString() || 0}</td>
                    </tr>
                    <tr>
                        <td>Total Tax</td>
                        <td>$${data.totalTax?.toFixed(2) || 0}</td>
                    </tr>
                    <tr>
                        <td>Total Inventory Value</td>
                        <td>$${data.totalInventoryValue?.toLocaleString() || 0}</td>
                    </tr>
                    <tr>
                        <td>Profit Margin</td>
                        <td>${data.profitMargin}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
}

/**
 * Format report as CSV
 */
export function formatAsCSV(data) {
    if (data.title.includes('Inventory')) {
        return generateInventoryCSV(data)
    }
    if (data.title.includes('Sales')) {
        return generateSalesCSV(data)
    }
    if (data.title.includes('Order Fulfillment')) {
        return generateOrderFulfillmentCSV(data)
    }
    if (data.title.includes('Low Stock')) {
        return generateLowStockCSV(data)
    }
    if (data.title.includes('Financial')) {
        return generateFinancialCSV(data)
    }
    return 'Report data not available'
}

function escapeCSV(value) {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
}

function generateInventoryCSV(data) {
    let csv = 'SKU,Product Name,Category,Stock,Min Stock,Status,Unit Value,Total Value\n'
    data.products?.forEach(product => {
        csv += [
            escapeCSV(product.sku),
            escapeCSV(product.name),
            escapeCSV(product.category?.name || 'N/A'),
            product.stock,
            product.minStock,
            escapeCSV(product.status),
            product.value?.toFixed(2),
            (product.value * product.stock).toFixed(2)
        ].join(',') + '\n'
    })
    return csv
}

function generateSalesCSV(data) {
    let csv = 'Order ID,Customer,Total,Status,Priority,Created Date\n'
    data.orders?.forEach(order => {
        csv += [
            escapeCSV(order.orderId),
            escapeCSV(order.customer),
            order.total?.toFixed(2),
            escapeCSV(order.status),
            escapeCSV(order.priority),
            new Date(order.createdAt).toLocaleDateString()
        ].join(',') + '\n'
    })
    return csv
}

function generateOrderFulfillmentCSV(data) {
    let csv = 'Order ID,Customer,Status,Priority,Due Date,Assigned To\n'
    data.orders?.forEach(order => {
        csv += [
            escapeCSV(order.orderId),
            escapeCSV(order.customer),
            escapeCSV(order.status),
            escapeCSV(order.priority),
            escapeCSV(order.dueDate),
            escapeCSV(order.assignedTo)
        ].join(',') + '\n'
    })
    return csv
}

function generateLowStockCSV(data) {
    let csv = 'SKU,Product Name,Category,Current Stock,Min Stock,Status,Location,Restock Quantity\n'
    data.products?.forEach(product => {
        csv += [
            escapeCSV(product.sku),
            escapeCSV(product.name),
            escapeCSV(product.category?.name || 'N/A'),
            product.stock,
            product.minStock,
            escapeCSV(product.status),
            escapeCSV(product.location),
            product.minStock - product.stock
        ].join(',') + '\n'
    })
    return csv
}

function generateFinancialCSV(data) {
    let csv = 'Metric,Value\n'
    csv += `Total Revenue,$${data.totalRevenue?.toFixed(2) || 0}\n`
    csv += `Total Subtotal,$${data.totalSubtotal?.toFixed(2) || 0}\n`
    csv += `Total Tax,$${data.totalTax?.toFixed(2) || 0}\n`
    csv += `Total Inventory Value,$${data.totalInventoryValue?.toFixed(2) || 0}\n`
    csv += `Order Count,${data.orderCount}\n`
    csv += `Average Order Value,$${data.averageOrderValue?.toFixed(2) || 0}\n`
    csv += `Profit Margin,${data.profitMargin}%\n`
    return csv
}
