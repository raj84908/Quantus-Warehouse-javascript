import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Unsync all products from Shopify
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { storeId } = await request.json()

    // Build where clause
    const whereClause = {
      syncedFromShopify: true,
      shopifyProductId: { not: null }
    }

    // If storeId provided, we could filter by store (would need to add storeId field to Product model)
    // For now, unsync all Shopify products

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
}
