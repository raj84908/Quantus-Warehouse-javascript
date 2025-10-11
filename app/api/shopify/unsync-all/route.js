import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// POST - Unsync all products from Shopify (organization-specific)
export const POST = withAuth(async (request, { user }) => {
  try {
    const { storeId } = await request.json()

    // Build where clause - ONLY for this organization's products
    const whereClause = {
      organizationId: user.organizationId,  // CRITICAL: Only this org's products
      syncedFromShopify: true,
      shopifyProductId: { not: null }
    }

    // Count products that will be unsynced
    const count = await prisma.product.count({
      where: whereClause
    })

    // Unsync all products - remove Shopify references but keep the products
    await prisma.product.updateMany({
      where: whereClause,
      data: {
        syncedFromShopify: false,
        shopifyProductId: null,
        shopifyVariantId: null,
        shopifyImageUrl: null
      }
    })

    return NextResponse.json({
      success: true,
      count,
      message: `Successfully unsynced ${count} products`
    })
  } catch (error) {
    console.error('Error unsyncing products:', error)
    return NextResponse.json({
      error: error.message || 'Failed to unsync products'
    }, { status: 500 })
  }
})
