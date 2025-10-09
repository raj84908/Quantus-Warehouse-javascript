/**
 * Shopify Configuration Check Middleware
 * Validates that Shopify is properly configured
 */

export function validateShopifyConfig() {
    const {
        SHOPIFY_SHOP_DOMAIN,
        SHOPIFY_ACCESS_TOKEN
    } = process.env

    const isConfigured = !!(SHOPIFY_SHOP_DOMAIN && SHOPIFY_ACCESS_TOKEN)

    return {
        isConfigured,
        config: isConfigured ? {
            shopDomain: SHOPIFY_SHOP_DOMAIN,
            hasAccessToken: true,
            hasApiKey: !!process.env.SHOPIFY_API_KEY,
            hasApiSecret: !!process.env.SHOPIFY_API_SECRET
        } : null,
        errors: []
    }
}

export function getShopifyStatus() {
    const validation = validateShopifyConfig()

    if (!validation.isConfigured) {
        return {
            status: 'not_configured',
            message: 'Shopify credentials not found in environment variables',
            action: 'Configure Shopify in Settings → Integrations'
        }
    }

    return {
        status: 'configured',
        message: 'Shopify is configured and ready',
        config: validation.config
    }
}
