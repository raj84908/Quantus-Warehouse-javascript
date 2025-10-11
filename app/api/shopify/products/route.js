import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch available products from Shopify store
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 })
    }

    // Get store connection
    const store = await prisma.shopifyConnection.findUnique({
      where: { id: storeId }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Fetch products from Shopify
    const shopifyUrl = `https://${store.shopDomain}/admin/api/2024-01/products.json`

    const response = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': store.accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch products from Shopify')
    }

    const data = await response.json()

    // Format products for display
    const products = data.products.map(product => ({
      id: product.id.toString(),
      title: product.title,
      handle: product.handle,
      status: product.status,
      image: product.images?.[0] || null,
      variants: product.variants.map(variant => ({
        id: variant.id.toString(),
        sku: variant.sku,
        price: variant.price,
        inventoryQuantity: variant.inventory_quantity
      })),
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }))

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    })
  } catch (error) {
    console.error('Error fetching Shopify products:', error)
    return NextResponse.json({
      error: error.message || 'Failed to fetch products'
    }, { status: 500 })
  }
}
