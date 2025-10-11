import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// DELETE - Remove a Shopify store connection (organization-specific)
export const DELETE = withAuth(async (request, { params, user }) => {
  try {
    const { storeId } = params

    // Check if store exists AND belongs to this organization
    const store = await prisma.shopifyConnection.findFirst({
      where: {
        id: parseInt(storeId),
        organizationId: user.organizationId  // CRITICAL: Verify ownership
      }
    })

    if (!store) {
      return NextResponse.json({
        error: 'Store not found or access denied'
      }, { status: 404 })
    }

    // Unsync all products from this store - ONLY for this organization
    await prisma.product.updateMany({
      where: {
        organizationId: user.organizationId,  // CRITICAL: Only this org's products
        shopifyProductId: { not: null },
        syncedFromShopify: true
      },
      data: {
        syncedFromShopify: false,
        shopifyProductId: null,
        shopifyVariantId: null,
        shopifyImageUrl: null
      }
    })

    // Delete the store connection
    await prisma.shopifyConnection.delete({
      where: { id: store.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Store removed successfully'
    })
  } catch (error) {
    console.error('Error removing store:', error)
    return NextResponse.json({ error: 'Failed to remove store' }, { status: 500 })
  }
})

// PATCH - Update store settings (organization-specific)
export const PATCH = withAuth(async (request, { params, user }) => {
  try {
    const { storeId } = params
    const { isActive } = await request.json()

    // Verify store belongs to this organization before updating
    const existingStore = await prisma.shopifyConnection.findFirst({
      where: {
        id: parseInt(storeId),
        organizationId: user.organizationId  // CRITICAL: Verify ownership
      }
    })

    if (!existingStore) {
      return NextResponse.json({
        error: 'Store not found or access denied'
      }, { status: 404 })
    }

    const store = await prisma.shopifyConnection.update({
      where: { id: existingStore.id },
      data: { isConnected: isActive }  // Update isConnected, not isActive
    })

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        shopDomain: store.shopDomain,
        isActive: store.isConnected
      }
    })
  } catch (error) {
    console.error('Error updating store:', error)
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 })
  }
})
