// Shopify Initialization Helper
// This file helps initialize Shopify connection from environment variables

import { prisma } from '@/lib/prisma'

/**
 * Initialize Shopify connection from environment variables if not already set up
 * This is useful for production deployments
 */
export async function initializeShopifyFromEnv() {
    try {
        // Check if environment variables are set
        const {
            SHOPIFY_SHOP_DOMAIN,
            SHOPIFY_ACCESS_TOKEN,
            SHOPIFY_API_KEY,
            SHOPIFY_API_SECRET
        } = process.env

        if (!SHOPIFY_SHOP_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
            console.log('Shopify env variables not set, skipping auto-initialization')
            return null
        }

        // Check if connection already exists
        const existingConnection = await prisma.shopifyConnection.findFirst({
            orderBy: { createdAt: 'desc' }
        })

        if (existingConnection) {
            console.log('Shopify connection already exists in database')
            return existingConnection
        }

        // Create connection from environment variables
        console.log('Creating Shopify connection from environment variables...')

        const cleanDomain = SHOPIFY_SHOP_DOMAIN
            .replace('https://', '')
            .replace('http://', '')
            .replace(/\/$/, '')

        const connection = await prisma.shopifyConnection.create({
            data: {
                shopDomain: cleanDomain,
                accessToken: SHOPIFY_ACCESS_TOKEN,
                apiKey: SHOPIFY_API_KEY || null,
                apiSecret: SHOPIFY_API_SECRET || null,
                isConnected: true,
            }
        })

        console.log(`✓ Shopify connection created for ${cleanDomain}`)
        return connection
    } catch (error) {
        console.error('Error initializing Shopify from env:', error)
        return null
    }
}