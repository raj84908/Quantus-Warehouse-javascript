# 🛍️ Advanced Shopify Features & Analytics Guide

## 📊 New Analytics Dashboards to Implement

### 1. Shopify Performance Dashboard

**Location**: `/app/shopify/analytics/page.jsx`

```jsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ShopifyAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [timeRange, setTimeRange] = useState('30d') // 7d, 30d, 90d, 1y

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    const res = await fetch(`/api/shopify/analytics?range=${timeRange}`)
    const data = await res.json()
    setAnalytics(data)
  }

  if (!analytics) return <div>Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Shopify Analytics</h1>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`$${analytics.totalRevenue.toLocaleString()}`}
          change={analytics.revenueChange}
          trend={analytics.revenueTrend}
        />
        <MetricCard
          title="Products Sold"
          value={analytics.productsSold}
          change={analytics.salesChange}
          trend={analytics.salesTrend}
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${analytics.avgOrderValue}`}
          change={analytics.aovChange}
          trend={analytics.aovTrend}
        />
        <MetricCard
          title="Sync Success Rate"
          value={`${analytics.syncSuccessRate}%`}
          change={null}
          trend="neutral"
        />
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="shopify" stroke="#8B5A3C" strokeWidth={2} />
              <Line type="monotone" dataKey="manual" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Shopify Products</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8B5A3C" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.productPerformance.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">
                      Sold: {product.unitsSold} | Stock: {product.currentStock}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${product.revenue}</div>
                    <div className={`text-sm ${product.velocityTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {product.velocity} units/day
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.categoryRevenue}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {analytics.categoryRevenue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sync Health Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Health Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="text-3xl font-bold text-green-600">{analytics.syncStats.successful}</div>
              <div className="text-sm text-gray-600">Successful Syncs</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <div className="text-3xl font-bold text-yellow-600">{analytics.syncStats.partial}</div>
              <div className="text-sm text-gray-600">Partial Syncs</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded">
              <div className="text-3xl font-bold text-red-600">{analytics.syncStats.failed}</div>
              <div className="text-sm text-gray-600">Failed Syncs</div>
            </div>
          </div>

          {/* Recent Sync Errors */}
          {analytics.recentSyncErrors.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">Recent Sync Errors</h4>
              <div className="space-y-2">
                {analytics.recentSyncErrors.map((error, index) => (
                  <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{error.productName}</span>
                      <span className="text-gray-500">{new Date(error.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-red-600 mt-1">{error.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Low Stock Alerts */}
            <div>
              <h4 className="font-semibold mb-3 text-orange-600">⚠️ Low Stock Alerts</h4>
              <div className="space-y-2">
                {analytics.lowStockProducts.map((product) => (
                  <div key={product.id} className="flex justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <span className="text-sm">{product.name}</span>
                    <span className="text-sm font-semibold">{product.stock} left</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overstock Warnings */}
            <div>
              <h4 className="font-semibold mb-3 text-blue-600">📦 Overstock Items</h4>
              <div className="space-y-2">
                {analytics.overstockProducts.map((product) => (
                  <div key={product.id} className="flex justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-sm">{product.name}</span>
                    <span className="text-sm font-semibold">{product.stock} units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reorder Recommendations */}
          <div className="mt-6">
            <h4 className="font-semibold mb-3 text-green-600">🔄 AI Reorder Recommendations</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Product</th>
                  <th className="text-right p-2">Current Stock</th>
                  <th className="text-right p-2">Recommended Order</th>
                  <th className="text-right p-2">Days Until Stockout</th>
                </tr>
              </thead>
              <tbody>
                {analytics.reorderRecommendations.map((rec) => (
                  <tr key={rec.id} className="border-b">
                    <td className="p-2">{rec.productName}</td>
                    <td className="text-right p-2">{rec.currentStock}</td>
                    <td className="text-right p-2 font-semibold text-green-600">{rec.recommendedOrder}</td>
                    <td className="text-right p-2 text-red-600">{rec.daysUntilStockout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const COLORS = ['#8B5A3C', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

function MetricCard({ title, value, change, trend }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-sm text-gray-500 mb-2">{title}</div>
        <div className="text-3xl font-bold mb-2">{value}</div>
        {change !== null && (
          <div className={`text-sm flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {change > 0 ? '+' : ''}{change}% vs last period
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 🔧 Backend API for Analytics

**Location**: `/app/api/shopify/analytics/route.js`

```javascript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Get organization ID from session (will implement with auth)
    // For now, we'll use the first connection
    const connection = await prisma.shopifyConnection.findFirst()
    if (!connection) {
      return NextResponse.json({ error: 'No Shopify connection found' }, { status: 404 })
    }

    const { startDate, endDate } = getDateRange(range)

    // Calculate analytics
    const analytics = await calculateShopifyAnalytics(startDate, endDate)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

async function calculateShopifyAnalytics(startDate, endDate) {
  // Total Revenue from Shopify products
  const shopifyOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      items: {
        some: {
          product: { syncedFromShopify: true }
        }
      }
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  })

  const totalRevenue = shopifyOrders.reduce((sum, order) => {
    const shopifyItemsTotal = order.items
      .filter(item => item.product?.syncedFromShopify)
      .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0)
    return sum + shopifyItemsTotal
  }, 0)

  // Previous period for comparison
  const previousPeriod = getPreviousPeriod(startDate, endDate)
  const previousRevenue = await calculateRevenue(previousPeriod.start, previousPeriod.end)
  const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 0

  // Products sold count
  const productsSold = shopifyOrders.reduce((sum, order) => {
    return sum + order.items
      .filter(item => item.product?.syncedFromShopify)
      .reduce((itemSum, item) => itemSum + item.quantity, 0)
  }, 0)

  // Average order value
  const avgOrderValue = shopifyOrders.length > 0 ? (totalRevenue / shopifyOrders.length).toFixed(2) : 0

  // Sync statistics
  const syncStats = await calculateSyncStats()

  // Top products
  const topProducts = await getTopProducts(startDate, endDate, 10)

  // Product performance with velocity
  const productPerformance = await getProductPerformance(startDate, endDate)

  // Category revenue
  const categoryRevenue = await getCategoryRevenue(startDate, endDate)

  // Revenue trend (daily data for chart)
  const revenueTrend = await getRevenueTrend(startDate, endDate)

  // Inventory intelligence
  const lowStockProducts = await getLowStockProducts()
  const overstockProducts = await getOverstockProducts()
  const reorderRecommendations = await getReorderRecommendations()

  // Recent sync errors
  const recentSyncErrors = await getRecentSyncErrors()

  return {
    totalRevenue,
    revenueChange: parseFloat(revenueChange),
    revenueTrend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'neutral',
    productsSold,
    salesChange: 0, // Calculate similarly
    salesTrend: 'up',
    avgOrderValue: parseFloat(avgOrderValue),
    aovChange: 0, // Calculate similarly
    aovTrend: 'up',
    syncSuccessRate: syncStats.successRate,
    syncStats: {
      successful: syncStats.successful,
      partial: syncStats.partial,
      failed: syncStats.failed
    },
    topProducts,
    productPerformance,
    categoryRevenue,
    revenueTrend,
    lowStockProducts,
    overstockProducts,
    reorderRecommendations,
    recentSyncErrors
  }
}

async function getTopProducts(startDate, endDate, limit = 10) {
  const products = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        createdAt: { gte: startDate, lte: endDate }
      },
      product: {
        syncedFromShopify: true
      }
    },
    _sum: {
      quantity: true,
      price: true
    },
    _count: {
      id: true
    }
  })

  // Enrich with product names
  const enriched = await Promise.all(
    products.map(async (p) => {
      const product = await prisma.product.findUnique({
        where: { id: p.productId },
        select: { name: true }
      })
      return {
        id: p.productId,
        name: product?.name || 'Unknown',
        revenue: p._sum.price * p._sum.quantity,
        unitsSold: p._sum.quantity,
        orders: p._count.id
      }
    })
  )

  return enriched
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

async function getProductPerformance(startDate, endDate) {
  const products = await prisma.product.findMany({
    where: {
      syncedFromShopify: true
    },
    include: {
      orderItems: {
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }
      }
    },
    take: 10,
    orderBy: {
      lastUpdated: 'desc'
    }
  })

  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

  return products.map(product => {
    const unitsSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
    const revenue = product.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const velocity = (unitsSold / daysDiff).toFixed(2) // Units per day

    return {
      id: product.id,
      name: product.name,
      unitsSold,
      revenue: revenue.toFixed(2),
      currentStock: product.stock,
      velocity,
      velocityTrend: velocity > 1 ? 'up' : 'down'
    }
  })
}

async function getCategoryRevenue(startDate, endDate) {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        where: {
          syncedFromShopify: true
        },
        include: {
          orderItems: {
            where: {
              order: {
                createdAt: { gte: startDate, lte: endDate }
              }
            }
          }
        }
      }
    }
  })

  return categories
    .map(category => {
      const revenue = category.products.reduce((sum, product) => {
        return sum + product.orderItems.reduce((itemSum, item) => {
          return itemSum + (item.price * item.quantity)
        }, 0)
      }, 0)

      return {
        name: category.name,
        value: parseFloat(revenue.toFixed(2))
      }
    })
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)
}

async function getRevenueTrend(startDate, endDate) {
  // Generate daily revenue data
  const days = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)

    const shopifyRevenue = await calculateRevenue(dayStart, dayEnd, true)
    const manualRevenue = await calculateRevenue(dayStart, dayEnd, false)

    days.push({
      date: currentDate.toISOString().split('T')[0],
      shopify: parseFloat(shopifyRevenue.toFixed(2)),
      manual: parseFloat(manualRevenue.toFixed(2))
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return days
}

async function calculateRevenue(startDate, endDate, shopifyOnly = true) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  })

  return orders.reduce((sum, order) => {
    const relevantItems = order.items.filter(item =>
      shopifyOnly ? item.product?.syncedFromShopify : !item.product?.syncedFromShopify
    )
    return sum + relevantItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0)
  }, 0)
}

async function calculateSyncStats() {
  const connection = await prisma.shopifyConnection.findFirst()

  if (!connection) {
    return { successful: 0, partial: 0, failed: 0, successRate: 0 }
  }

  // In a real implementation, you'd track sync logs
  // For now, return mock data
  return {
    successful: connection.syncCount || 0,
    partial: 0,
    failed: 0,
    successRate: 98.5
  }
}

async function getLowStockProducts() {
  return await prisma.product.findMany({
    where: {
      syncedFromShopify: true,
      stock: {
        lte: prisma.product.fields.minStock
      }
    },
    select: {
      id: true,
      name: true,
      stock: true,
      minStock: true
    },
    take: 5,
    orderBy: {
      stock: 'asc'
    }
  })
}

async function getOverstockProducts() {
  // Products with stock > 100 and slow sales velocity
  const products = await prisma.product.findMany({
    where: {
      syncedFromShopify: true,
      stock: { gte: 100 }
    },
    include: {
      orderItems: {
        where: {
          order: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    },
    take: 10
  })

  return products
    .filter(p => {
      const unitsSold = p.orderItems.reduce((sum, item) => sum + item.quantity, 0)
      return unitsSold < (p.stock * 0.1) // Sold less than 10% of stock in 30 days
    })
    .map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock
    }))
    .slice(0, 5)
}

async function getReorderRecommendations() {
  const products = await prisma.product.findMany({
    where: {
      syncedFromShopify: true
    },
    include: {
      orderItems: {
        where: {
          order: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    }
  })

  const recommendations = products.map(product => {
    const unitsSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
    const dailyVelocity = unitsSold / 30
    const daysUntilStockout = dailyVelocity > 0 ? Math.floor(product.stock / dailyVelocity) : Infinity
    const recommendedOrder = Math.ceil(dailyVelocity * 45) // 45 days supply

    return {
      id: product.id,
      productName: product.name,
      currentStock: product.stock,
      recommendedOrder,
      daysUntilStockout: daysUntilStockout === Infinity ? 'N/A' : daysUntilStockout
    }
  })

  return recommendations
    .filter(r => r.daysUntilStockout !== 'N/A' && r.daysUntilStockout < 14)
    .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
    .slice(0, 5)
}

async function getRecentSyncErrors() {
  // In production, you'd have a ShopifySyncLog table
  // For now, return empty array
  return []
}

function getDateRange(range) {
  const endDate = new Date()
  let startDate = new Date()

  switch (range) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(endDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(endDate.getDate() - 90)
      break
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1)
      break
    default:
      startDate.setDate(endDate.getDate() - 30)
  }

  return { startDate, endDate }
}

function getPreviousPeriod(startDate, endDate) {
  const duration = endDate - startDate
  return {
    start: new Date(startDate - duration),
    end: new Date(endDate - duration)
  }
}
```

---

## 🎯 Quick Wins - Easy Features to Add Right Now

### 1. Shopify Product Search Enhancement

Add full-text search to products:

```javascript
// In app/shopify/page.jsx
const searchProducts = (term) => {
  return products.filter(p =>
    p.name.toLowerCase().includes(term.toLowerCase()) ||
    p.sku.toLowerCase().includes(term.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(term.toLowerCase())
  )
}
```

### 2. Export Shopify Products to CSV

```javascript
// app/api/shopify/export/route.js
export async function GET() {
  const products = await prisma.product.findMany({
    where: { syncedFromShopify: true },
    include: { category: true }
  })

  const csv = [
    ['SKU', 'Name', 'Category', 'Stock', 'Price', 'Shopify ID'],
    ...products.map(p => [
      p.sku,
      p.name,
      p.category.name,
      p.stock,
      p.value,
      p.shopifyProductId
    ])
  ].map(row => row.join(',')).join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=shopify-products.csv'
    }
  })
}
```

### 3. Bulk Stock Update

```javascript
// app/api/shopify/bulk-update-stock/route.js
export async function POST(request) {
  const { updates } = await request.json()
  // updates = [{ productId, newStock }, ...]

  const results = await Promise.all(
    updates.map(async ({ productId, newStock }) => {
      return await prisma.product.update({
        where: { id: productId },
        data: { stock: newStock }
      })
    })
  )

  return NextResponse.json({ updated: results.length })
}
```

### 4. Shopify Sync Scheduler (Cron Job)

```javascript
// app/api/cron/sync-shopify/route.js
// Add to vercel.json: "crons": [{"path": "/api/cron/sync-shopify", "schedule": "0 */6 * * *"}]

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Run sync for all active connections
  const connections = await prisma.shopifyConnection.findMany({
    where: { isActive: true, autoSync: true }
  })

  for (const conn of connections) {
    await syncShopifyProducts(conn.organizationId)
  }

  return NextResponse.json({ synced: connections.length })
}
```

---

## 📈 Future Advanced Features

1. **AI-Powered Demand Forecasting**
   - Use historical sales data to predict future demand
   - Seasonal trend detection
   - Automatic reorder point calculation

2. **Multi-Currency Support**
   - Convert Shopify prices to local currency
   - Handle currency conversion for reporting

3. **Advanced Filtering**
   - Filter by profit margin
   - Filter by stock velocity
   - Filter by last sync date

4. **Shopify Collections Sync**
   - Sync Shopify collections as categories
   - Maintain collection hierarchy

5. **Customer Sync**
   - Import Shopify customers
   - Track customer purchase history

6. **Order Fulfillment Integration**
   - Sync order status back to Shopify
   - Track fulfillment status

---

**Created**: January 2025
**Status**: 📋 Implementation Ready
