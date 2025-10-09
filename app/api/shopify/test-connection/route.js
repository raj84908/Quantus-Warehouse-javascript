import { NextResponse } from 'next/server'
import { testShopifyConnection } from '@/lib/shopify'

// POST - Test Shopify connection with provided credentials
export async function POST(req) {
    try {
        const data = await req.json()
        const { shopDomain, accessToken } = data

        if (!shopDomain || !accessToken) {
            return NextResponse.json(
                { error: 'Shop domain and access token are required' },
                { status: 400 }
            )
        }

        // Clean up shop domain
        const cleanDomain = shopDomain
            .replace('https://', '')
            .replace('http://', '')
            .replace(/\/$/, '')

        const result = await testShopifyConnection({
            shopDomain: cleanDomain,
            accessToken
        })

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: 'Connection successful!',
                shopName: result.shop.name,
                shopEmail: result.shop.email,
                shopDomain: result.shop.domain,
            })
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Connection test failed'
                },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Error testing Shopify connection:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to test connection'
            },
            { status: 500 }
        )
    }
}
