import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - List all connected Shopify stores
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all Shopify connections for the user
    const stores = await prisma.shopifyConnection.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      stores: stores.map(store => ({
        id: store.id,
        shopDomain: store.shopDomain,
        isActive: store.isActive || true,
        lastSyncAt: store.lastSyncAt,
        createdAt: store.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}

// POST - Add a new Shopify store connection
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { shopDomain, accessToken } = await request.json()

    if (!shopDomain || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if store already exists
    const existing = await prisma.shopifyConnection.findFirst({
      where: { shopDomain }
    })

    if (existing) {
      return NextResponse.json({ error: 'Store already connected' }, { status: 400 })
    }

    // Create new connection
    const store = await prisma.shopifyConnection.create({
      data: {
        shopDomain,
        accessToken,
        isActive: true
      }
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
    console.error('Error adding store:', error)
    return NextResponse.json({ error: 'Failed to add store' }, { status: 500 })
  }
}
