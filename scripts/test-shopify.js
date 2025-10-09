#!/usr/bin/env node

/**
 * Shopify Connection Test Script
 * Run this to verify your Shopify credentials are working
 * Usage: node scripts/test-shopify.js
 */

// Load environment variables from .env file
require('dotenv').config()

const { testShopifyConnection, fetchShopifyProducts, createShopifyClient } = require('../lib/shopify')

async function testConnection() {
    console.log('\n🛒 Testing Shopify Connection...\n')

    try {
        // Test connection
        console.log('1️⃣  Testing connection to Shopify...')
        const testResult = await testShopifyConnection({
            shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
            accessToken: process.env.SHOPIFY_ACCESS_TOKEN
        })

        if (!testResult.success) {
            console.error('❌ Connection failed:', testResult.error)
            process.exit(1)
        }

        console.log('✅ Connection successful!')
        console.log('   Shop Name:', testResult.shop.name)
        console.log('   Shop Email:', testResult.shop.email)
        console.log('   Shop Domain:', testResult.shop.domain)
        console.log('   Currency:', testResult.shop.currency)

        // Fetch products
        console.log('\n2️⃣  Fetching products from Shopify...')
        const client = await createShopifyClient({
            shopDomain: process.env.SHOPIFY_SHOP_DOMAIN,
            accessToken: process.env.SHOPIFY_ACCESS_TOKEN
        })

        const products = await fetchShopifyProducts(client)
        console.log(`✅ Successfully fetched ${products.length} products`)

        // Display product summary
        if (products.length > 0) {
            console.log('\n📦 Product Summary:')

            let totalVariants = 0
            products.forEach(product => {
                totalVariants += (product.variants || []).length
            })

            console.log(`   Total Products: ${products.length}`)
            console.log(`   Total Variants: ${totalVariants}`)

            console.log('\n📋 First 5 products:')
            products.slice(0, 5).forEach((product, index) => {
                console.log(`   ${index + 1}. ${product.title} (${product.variants?.length || 0} variants)`)
            })
        }

        console.log('\n✨ All tests passed! Your Shopify integration is ready.\n')
    } catch (error) {
        console.error('\n❌ Error:', error.message)
        console.error('Stack:', error.stack)
        process.exit(1)
    }
}

testConnection()