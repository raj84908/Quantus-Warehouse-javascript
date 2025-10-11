import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// GET - List all connected Shopify stores (organization-specific)
export const GET = withAuth(async (request, { user }) => {
  try {
    // Get Shopify connections ONLY for this organization
    const stores = await prisma.shopifyConnection.findMany({
      where: {
        organizationId: user.organizationId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      stores: stores.map(store => ({
        id: store.id,
        shopDomain: store.shopDomain,
        isActive: store.isConnected || true,
        lastSyncAt: store.lastSyncAt,
        createdAt: store.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
})

// POST - Add a new Shopify store connection (organization-specific)
export const POST = withAuth(async (request, { user }) => {
  try {
    const { shopDomain, accessToken } = await request.json()

    if (!shopDomain || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if this organization already has a store connected
    // Since organizationId is unique in ShopifyConnection, only one store per org
    const existing = await prisma.shopifyConnection.findFirst({
      where: { organizationId: user.organizationId }
    })

    if (existing) {
      return NextResponse.json({
        error: 'Organization already has a Shopify store connected. Please disconnect first.'
      }, { status: 400 })
    }

    // Create new connection for this organization
    const store = await prisma.shopifyConnection.create({
      data: {
        shopDomain,
        accessToken,
        isConnected: true,
        organizationId: user.organizationId
      }
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
    console.error('Error adding store:', error)
    return NextResponse.json({ error: 'Failed to add store' }, { status: 500 })
  }
})
