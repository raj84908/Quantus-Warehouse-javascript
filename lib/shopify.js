import '@shopify/shopify-api/adapters/node'
import { shopifyApi, ApiVersion } from '@shopify/shopify-api'

// Initialize Shopify API with environment variables as defaults
const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY || 'default_key',
    apiSecretKey: process.env.SHOPIFY_API_SECRET || 'default_secret',
    scopes: ['read_products', 'write_products', 'read_orders', 'write_orders', 'read_inventory', 'write_inventory'],
    hostName: process.env.SHOPIFY_SHOP_DOMAIN?.replace('https://', '').replace('http://', '').replace(/\/$/, '') || 'default.myshopify.com',
    apiVersion: ApiVersion.October24,
    isEmbeddedApp: false,
})

/**
 * Create a Shopify REST API client with custom credentials
 * @param {Object} credentials - Shopify credentials
 * @param {string} credentials.shopDomain - Shop domain (e.g., your-store.myshopify.com)
 * @param {string} credentials.accessToken - Admin API access token
 */
export async function createShopifyClient(credentials = null) {
    const session = {
        shop: credentials?.shopDomain || process.env.SHOPIFY_SHOP_DOMAIN?.replace('https://', '').replace(/\/$/, ''),
        accessToken: credentials?.accessToken || process.env.SHOPIFY_ACCESS_TOKEN,
    }

    return new shopify.clients.Rest({ session })
}

/**
 * Fetch all products from Shopify (handles pagination)
 * @param {Object} client - Shopify REST client
 */
export async function fetchShopifyProducts(client) {
    let allProducts = []
    let params = { limit: 250 }

    try {
        while (true) {
            const response = await client.get({
                path: 'products',
                query: params,
            })

            const products = response.body.products || []
            allProducts = allProducts.concat(products)

            // Check for pagination using pageInfo
            if (response.pageInfo && response.pageInfo.nextPage) {
                const nextPageInfo = response.pageInfo.nextPage.query?.page_info
                if (nextPageInfo) {
                    params = { limit: 250, page_info: nextPageInfo }
                } else {
                    break
                }
            } else {
                // Fallback to link header method
                const linkHeader = response.headers?.link
                if (!linkHeader || !linkHeader.includes('rel="next"')) {
                    break
                }

                // Extract next page info from link header
                const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'))
                if (!nextLink) break

                const pageInfoMatch = nextLink.match(/page_info=([^&>]+)/)
                if (!pageInfoMatch) break

                params = { limit: 250, page_info: pageInfoMatch[1] }
            }
        }

        return allProducts
    } catch (error) {
        console.error('Error fetching Shopify products:', error)
        throw new Error(`Failed to fetch products from Shopify: ${error.message}`)
    }
}

/**
 * Test Shopify connection
 * @param {Object} credentials - Shopify credentials to test
 */
export async function testShopifyConnection(credentials) {
    try {
        const client = await createShopifyClient(credentials)

        // Try to fetch shop info as a connection test
        const response = await client.get({
            path: 'shop',
        })

        return {
            success: true,
            shop: response.body.shop,
        }
    } catch (error) {
        console.error('Shopify connection test failed:', error)
        return {
            success: false,
            error: error.message,
        }
    }
}

/**
 * Map Shopify product data to our database schema
 * @param {Object} shopifyProduct - Shopify product object
 * @param {Object} shopifyVariant - Shopify variant object
 * @param {number} defaultCategoryId - Default category ID for Shopify products
 */
export function mapShopifyProductToSchema(shopifyProduct, shopifyVariant, defaultCategoryId) {
    const variantTitle = shopifyVariant.title !== 'Default Title'
        ? `${shopifyProduct.title} - ${shopifyVariant.title}`
        : shopifyProduct.title

    // Get the first image or variant-specific image
    const imageUrl = shopifyVariant.image_id
        ? shopifyProduct.images?.find(img => img.id === shopifyVariant.image_id)?.src
        : shopifyProduct.image?.src || shopifyProduct.images?.[0]?.src

    return {
        sku: shopifyVariant.sku || `SHOPIFY-${shopifyVariant.id}`,
        name: variantTitle,
        categoryId: defaultCategoryId,
        stock: shopifyVariant.inventory_quantity || 0,
        minStock: 5, // Default minimum stock
        location: 'Shopify', // Default location
        value: parseFloat(shopifyVariant.price) || 0,
        shopifyProductId: shopifyProduct.id.toString(),
        shopifyVariantId: shopifyVariant.id.toString(),
        shopifyImageUrl: imageUrl || null,
        syncedFromShopify: true,
        status: (shopifyVariant.inventory_quantity || 0) > 5 ? 'IN_STOCK'
            : (shopifyVariant.inventory_quantity || 0) > 0 ? 'LOW_STOCK'
            : 'OUT_OF_STOCK',
    }
}

export default shopify