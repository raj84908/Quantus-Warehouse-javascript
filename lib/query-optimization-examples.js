/**
 * Database Query Optimization Examples
 *
 * This file demonstrates optimized Prisma queries for multi-tenant application
 * Best practices for Neon PostgreSQL + Vercel deployment
 */

import { prisma } from './prisma'

// ========================================
// BASIC OPTIMIZATION PATTERNS
// ========================================

/**
 * ❌ BAD: Fetches all fields, no pagination
 */
export async function getProducts_BAD() {
  return await prisma.product.findMany()
}

/**
 * ✅ GOOD: Selective fields, pagination, organization filter
 */
export async function getProducts_GOOD(organizationId, page = 0, limit = 50) {
  return await prisma.product.findMany({
    where: {
      organizationId
    },
    select: {
      id: true,
      sku: true,
      name: true,
      stock: true,
      value: true,
      status: true,
      category: {
        select: {
          id: true,
          name: true
        }
      }
    },
    take: limit,
    skip: page * limit,
    orderBy: {
      lastUpdated: 'desc'
    }
  })
}

// ========================================
// PAGINATION STRATEGIES
// ========================================

/**
 * Offset-based pagination (good for small datasets)
 */
export async function getProductsPaginated(organizationId, page = 0, limit = 50) {
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: { organizationId },
      take: limit,
      skip: page * limit,
      orderBy: { id: 'desc' }
    }),
    prisma.product.count({
      where: { organizationId }
    })
  ])

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Cursor-based pagination (better for large datasets)
 */
export async function getProductsCursorPaginated(
  organizationId,
  cursor = null,
  limit = 50
) {
  const products = await prisma.product.findMany({
    where: { organizationId },
    take: limit + 1, // Fetch one extra to check if there's a next page
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { id: 'desc' }
  })

  const hasNextPage = products.length > limit
  const items = hasNextPage ? products.slice(0, -1) : products

  return {
    products: items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage
  }
}

// ========================================
// EFFICIENT FILTERING & SEARCH
// ========================================

/**
 * Full-text search with filters
 */
export async function searchProducts(organizationId, query, filters = {}) {
  const where = {
    organizationId,
    ...(query && {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { category: { name: { contains: query, mode: 'insensitive' } } }
      ]
    }),
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.status && { status: filters.status }),
    ...(filters.minStock && { stock: { gte: filters.minStock } }),
    ...(filters.maxStock && { stock: { lte: filters.maxStock } }),
    ...(filters.syncedFromShopify !== undefined && {
      syncedFromShopify: filters.syncedFromShopify
    })
  }

  const [products, count] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        stock: true,
        value: true,
        status: true,
        category: {
          select: { id: true, name: true }
        }
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: filters.orderBy || { lastUpdated: 'desc' }
    }),
    prisma.product.count({ where })
  ])

  return { products, count }
}

// ========================================
// EFFICIENT AGGREGATIONS
// ========================================

/**
 * Get dashboard statistics efficiently
 */
export async function getDashboardStats(organizationId) {
  const [
    productStats,
    orderStats,
    lowStock,
    recentOrders
  ] = await prisma.$transaction([
    // Product stats
    prisma.product.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
      _sum: { value: true, stock: true }
    }),

    // Order stats
    prisma.order.groupBy({
      by: ['status'],
      where: {
        organizationId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: { id: true },
      _sum: { total: true }
    }),

    // Low stock products count
    prisma.product.count({
      where: {
        organizationId,
        OR: [
          { status: 'LOW_STOCK' },
          { status: 'OUT_OF_STOCK' }
        ]
      }
    }),

    // Recent orders
    prisma.order.findMany({
      where: { organizationId },
      select: {
        id: true,
        orderId: true,
        customer: true,
        total: true,
        status: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
  ])

  return {
    products: {
      total: productStats.reduce((sum, s) => sum + s._count.id, 0),
      byStatus: productStats,
      totalValue: productStats.reduce((sum, s) => sum + (s._sum.value || 0), 0)
    },
    orders: {
      total: orderStats.reduce((sum, s) => sum + s._count.id, 0),
      byStatus: orderStats,
      totalRevenue: orderStats.reduce((sum, s) => sum + (s._sum.total || 0), 0)
    },
    lowStock,
    recentOrders
  }
}

// ========================================
// OPTIMIZED JOINS & RELATIONS
// ========================================

/**
 * ❌ BAD: N+1 query problem
 */
export async function getOrdersWithItems_BAD(organizationId) {
  const orders = await prisma.order.findMany({
    where: { organizationId }
  })

  // This creates N additional queries!
  for (const order of orders) {
    order.items = await prisma.orderItem.findMany({
      where: { orderId: order.id }
    })
  }

  return orders
}

/**
 * ✅ GOOD: Single query with includes
 */
export async function getOrdersWithItems_GOOD(organizationId) {
  return await prisma.order.findMany({
    where: { organizationId },
    include: {
      items: {
        select: {
          id: true,
          sku: true,
          name: true,
          quantity: true,
          price: true,
          product: {
            select: {
              id: true,
              stock: true,
              shopifyImageUrl: true
            }
          }
        }
      },
      partialPayments: {
        select: {
          amount: true,
          paymentDate: true,
          paymentMethod: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })
}

// ========================================
// BATCH OPERATIONS
// ========================================

/**
 * ❌ BAD: Multiple individual updates
 */
export async function updateProductPrices_BAD(updates) {
  for (const { id, newPrice } of updates) {
    await prisma.product.update({
      where: { id },
      data: { value: newPrice }
    })
  }
}

/**
 * ✅ GOOD: Single transaction with batch updates
 */
export async function updateProductPrices_GOOD(updates, organizationId) {
  return await prisma.$transaction(
    updates.map(({ id, newPrice }) =>
      prisma.product.update({
        where: {
          id,
          organizationId // Security: ensure belongs to org
        },
        data: { value: newPrice }
      })
    )
  )
}

/**
 * ✅ BETTER: Use updateMany when possible
 */
export async function bulkUpdateStatus(productIds, status, organizationId) {
  return await prisma.product.updateMany({
    where: {
      id: { in: productIds },
      organizationId
    },
    data: {
      status
    }
  })
}

// ========================================
// ADVANCED QUERIES
// ========================================

/**
 * Get top-selling products with revenue calculation
 */
export async function getTopSellingProducts(organizationId, startDate, endDate, limit = 10) {
  // Use raw SQL for complex aggregations
  const results = await prisma.$queryRaw`
    SELECT
      p.id,
      p.name,
      p.sku,
      p.stock,
      SUM(oi.quantity) as units_sold,
      SUM(oi.quantity * oi.price) as revenue,
      COUNT(DISTINCT o.id) as order_count
    FROM "Product" p
    INNER JOIN "OrderItem" oi ON p.id = oi."productId"
    INNER JOIN "Order" o ON oi."orderId" = o.id
    WHERE
      p."organizationId" = ${organizationId}
      AND o."createdAt" >= ${startDate}
      AND o."createdAt" <= ${endDate}
    GROUP BY p.id, p.name, p.sku, p.stock
    ORDER BY revenue DESC
    LIMIT ${limit}
  `

  return results
}

/**
 * Get inventory value by category
 */
export async function getInventoryValueByCategory(organizationId) {
  const result = await prisma.category.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      products: {
        select: {
          value: true,
          stock: true
        }
      }
    }
  })

  return result.map(category => ({
    categoryId: category.id,
    categoryName: category.name,
    totalValue: category.products.reduce(
      (sum, p) => sum + (p.value * p.stock),
      0
    ),
    productCount: category.products.length
  }))
}

/**
 * Get stock movement history with efficient query
 */
export async function getStockMovementHistory(
  productId,
  organizationId,
  days = 30
) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  return await prisma.stockAdjustment.findMany({
    where: {
      productId,
      product: { organizationId },
      createdAt: { gte: startDate }
    },
    select: {
      id: true,
      quantity: true,
      previousStock: true,
      newStock: true,
      reason: true,
      adjustedBy: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ========================================
// CACHING PATTERNS
// ========================================

/**
 * In-memory cache for frequently accessed data
 */
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getCachedCategories(organizationId) {
  const cacheKey = `categories:${organizationId}`
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const categories = await prisma.category.findMany({
    where: { organizationId, isActive: true },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true
    },
    orderBy: { sortOrder: 'asc' }
  })

  cache.set(cacheKey, {
    data: categories,
    timestamp: Date.now()
  })

  return categories
}

/**
 * Invalidate cache helper
 */
export function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

// ========================================
// DATABASE PERFORMANCE MONITORING
// ========================================

/**
 * Middleware to log slow queries
 */
export async function logSlowQueries(query, params, duration) {
  if (duration > 1000) { // Log queries taking > 1 second
    console.warn('Slow query detected:', {
      query,
      params,
      duration: `${duration}ms`
    })

    // In production, send to monitoring service
    // await sendToMonitoring({ type: 'slow_query', query, duration })
  }
}

/**
 * Query execution wrapper with timing
 */
export async function timedQuery(name, queryFn) {
  const start = Date.now()

  try {
    const result = await queryFn()
    const duration = Date.now() - start

    if (process.env.NODE_ENV === 'development') {
      console.log(`Query ${name}: ${duration}ms`)
    }

    await logSlowQueries(name, {}, duration)

    return result
  } catch (error) {
    console.error(`Query ${name} failed:`, error)
    throw error
  }
}

// ========================================
// MIGRATION HELPERS
// ========================================

/**
 * Safely migrate existing data to multi-tenant schema
 */
export async function migrateToMultiTenant(defaultOrganizationId) {
  console.log('Starting multi-tenant migration...')

  // 1. Update all products
  const productsUpdated = await prisma.product.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrganizationId }
  })
  console.log(`Updated ${productsUpdated.count} products`)

  // 2. Update all orders
  const ordersUpdated = await prisma.order.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrganizationId }
  })
  console.log(`Updated ${ordersUpdated.count} orders`)

  // 3. Update all categories
  const categoriesUpdated = await prisma.category.updateMany({
    where: { organizationId: null },
    data: { organizationId: defaultOrganizationId }
  })
  console.log(`Updated ${categoriesUpdated.count} categories`)

  console.log('Migration completed!')
}

// ========================================
// ANALYTICS QUERIES
// ========================================

/**
 * Get sales trend data for charts
 */
export async function getSalesTrend(organizationId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const orders = await prisma.order.groupBy({
    by: ['createdAt'],
    where: {
      organizationId,
      createdAt: { gte: startDate }
    },
    _sum: {
      total: true
    },
    _count: {
      id: true
    }
  })

  // Group by day
  const dailyData = {}
  orders.forEach(order => {
    const date = order.createdAt.toISOString().split('T')[0]
    if (!dailyData[date]) {
      dailyData[date] = { revenue: 0, orders: 0 }
    }
    dailyData[date].revenue += order._sum.total || 0
    dailyData[date].orders += order._count.id
  })

  return Object.entries(dailyData).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    orders: data.orders,
    avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0
  }))
}

/**
 * Get product performance metrics
 */
export async function getProductMetrics(productId, organizationId) {
  const product = await prisma.product.findUnique({
    where: { id: productId, organizationId },
    include: {
      orderItems: {
        where: {
          order: {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
            }
          }
        }
      },
      stockAdjustments: {
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!product) return null

  const totalSold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const revenue = product.orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  const avgDailySales = totalSold / 90

  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      currentStock: product.stock,
      value: product.value
    },
    metrics: {
      totalSold,
      revenue,
      avgDailySales,
      daysUntilStockout: avgDailySales > 0 ? Math.floor(product.stock / avgDailySales) : Infinity,
      stockVelocity: avgDailySales,
      recommendedReorderPoint: Math.ceil(avgDailySales * 14) // 2 weeks supply
    },
    recentAdjustments: product.stockAdjustments
  }
}

// ========================================
// EXPORT UTILITIES
// ========================================

/**
 * Export data with streaming for large datasets
 */
export async function exportProducts(organizationId, format = 'json') {
  const batchSize = 1000
  let cursor = null
  let allProducts = []

  while (true) {
    const batch = await prisma.product.findMany({
      where: { organizationId },
      take: batchSize,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { id: 'asc' },
      include: {
        category: {
          select: { name: true }
        }
      }
    })

    if (batch.length === 0) break

    allProducts = allProducts.concat(batch)
    cursor = batch[batch.length - 1].id

    if (batch.length < batchSize) break
  }

  if (format === 'csv') {
    return convertToCSV(allProducts)
  }

  return allProducts
}

function convertToCSV(data) {
  const headers = Object.keys(data[0])
  const rows = data.map(item =>
    headers.map(header =>
      JSON.stringify(item[header] || '')
    ).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}
