import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createShopifyClient, fetchShopifyProducts, mapShopifyProductToSchema } from '@/lib/shopify'

// POST - Sync products from Shopify to database
export async function POST(req) {
    try {
        // Get Shopify connection from database
        const connection = await prisma.shopifyConnection.findFirst({
            where: { isConnected: true },
            orderBy: { createdAt: 'desc' }
        })

        if (!connection) {
            return NextResponse.json(
                { error: 'No Shopify connection found. Please connect your store first.' },
                { status: 400 }
            )
        }

        // Create Shopify client
        const client = await createShopifyClient({
            shopDomain: connection.shopDomain,
            accessToken: connection.accessToken
        })

        // Fetch all products from Shopify
        console.log('Fetching products from Shopify...')
        const shopifyProducts = await fetchShopifyProducts(client)
        console.log(`Fetched ${shopifyProducts.length} products from Shopify`)

        // Ensure "Shopify" category exists
        let shopifyCategory = await prisma.category.findFirst({
            where: { name: 'Shopify' }
        })

        if (!shopifyCategory) {
            shopifyCategory = await prisma.category.create({
                data: { name: 'Shopify' }
            })
        }

        const results = {
            added: 0,
            updated: 0,
            errors: [],
            total: 0
        }

        // Process each product and its variants
        for (const shopifyProduct of shopifyProducts) {
            const variants = shopifyProduct.variants || []

            // Skip products with no variants
            if (variants.length === 0) {
                console.warn(`Product ${shopifyProduct.id} has no variants, skipping...`)
                continue
            }

            for (const variant of variants) {
                try {
                    results.total++

                    // Map Shopify data to our schema
                    const productData = mapShopifyProductToSchema(
                        shopifyProduct,
                        variant,
                        shopifyCategory.id
                    )

                    // Validate required fields
                    if (!productData.sku || !productData.name) {
                        throw new Error('Missing required fields: SKU or name')
                    }

                    // Check if product exists by Shopify variant ID or SKU
                    const existingProduct = await prisma.product.findFirst({
                        where: {
                            OR: [
                                { shopifyVariantId: variant.id.toString() },
                                { sku: productData.sku }
                            ]
                        }
                    })

                    if (existingProduct) {
                        // Update existing product
                        await prisma.product.update({
                            where: { id: existingProduct.id },
                            data: {
                                name: productData.name,
                                stock: productData.stock,
                                value: productData.value,
                                status: productData.status,
                                shopifyProductId: productData.shopifyProductId,
                                shopifyVariantId: productData.shopifyVariantId,
                                shopifyImageUrl: productData.shopifyImageUrl,
                                syncedFromShopify: true,
                            }
                        })
                        results.updated++
                        console.log(`✓ Updated: ${productData.name} (${productData.sku})`)
                    } else {
                        // Create new product
                        await prisma.product.create({
                            data: productData
                        })
                        results.added++
                        console.log(`✓ Added: ${productData.name} (${productData.sku})`)
                    }
                } catch (error) {
                    console.error(`✗ Error processing variant ${variant.id}:`, error)
                    results.errors.push({
                        productTitle: shopifyProduct.title,
                        variantId: variant.id,
                        variantTitle: variant.title,
                        error: error.message
                    })
                }
            }
        }

        // Update last sync time
        await prisma.shopifyConnection.update({
            where: { id: connection.id },
            data: { lastSyncAt: new Date() }
        })

        console.log('Sync complete:', results)

        return NextResponse.json({
            success: true,
            message: 'Products synced successfully',
            results: {
                total: results.total,
                added: results.added,
                updated: results.updated,
                errors: results.errors.length,
                errorDetails: results.errors.slice(0, 10) // Only return first 10 errors
            }
        })
    } catch (error) {
        console.error('Error syncing Shopify products:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to sync products'
            },
            { status: 500 }
        )
    }
}
