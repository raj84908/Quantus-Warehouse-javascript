import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// DELETE - Remove a Shopify store connection
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { storeId } = params

    // Check if store exists
    const store = await prisma.shopifyConnection.findUnique({
      where: { id: storeId }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Unsync all products from this store
    await prisma.product.updateMany({
      where: {
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
      where: { id: storeId }
    })

    return NextResponse.json({
      success: true,
      message: 'Store removed successfully'
    })
  } catch (error) {
    console.error('Error removing store:', error)
    return NextResponse.json({ error: 'Failed to remove store' }, { status: 500 })
  }
}

// PATCH - Update store settings
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { storeId } = params
    const { isActive } = await request.json()

    const store = await prisma.shopifyConnection.update({
      where: { id: storeId },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        shopDomain: store.shopDomain,
        isActive: store.isActive
      }
    })
  } catch (error) {
    console.error('Error updating store:', error)
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 })
  }
}
