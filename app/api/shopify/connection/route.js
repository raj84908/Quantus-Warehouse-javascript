import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Retrieve Shopify connection status and credentials
export async function GET() {
    try {
        const connection = await prisma.shopifyConnection.findFirst({
            orderBy: { createdAt: 'desc' }
        })

        if (!connection) {
            return NextResponse.json({
                isConnected: false,
                connection: null
            })
        }

        // Return connection data without sensitive info in some cases
        return NextResponse.json({
            isConnected: connection.isConnected,
            connection: {
                id: connection.id,
                shopDomain: connection.shopDomain,
                lastSyncAt: connection.lastSyncAt,
                createdAt: connection.createdAt,
                updatedAt: connection.updatedAt,
                // Include credentials for settings page (in production, consider auth)
                accessToken: connection.accessToken,
                apiKey: connection.apiKey,
                apiSecret: connection.apiSecret,
            }
        })
    } catch (error) {
        console.error('Error fetching Shopify connection:', error)
        return NextResponse.json(
            { error: 'Failed to fetch connection' },
            { status: 500 }
        )
    }
}

// POST - Save new Shopify credentials
export async function POST(req) {
    try {
        const data = await req.json()
        const { shopDomain, accessToken, apiKey, apiSecret } = data

        if (!shopDomain || !accessToken) {
            return NextResponse.json(
                { error: 'Shop domain and access token are required' },
                { status: 400 }
            )
        }

        // Clean up shop domain (remove https:// and trailing slash)
        const cleanDomain = shopDomain
            .replace('https://', '')
            .replace('http://', '')
            .replace(/\/$/, '')

        // Delete existing connection (we only support one connection)
        await prisma.shopifyConnection.deleteMany({})

        // Create new connection
        const connection = await prisma.shopifyConnection.create({
            data: {
                shopDomain: cleanDomain,
                accessToken,
                apiKey: apiKey || null,
                apiSecret: apiSecret || null,
                isConnected: true,
            }
        })

        return NextResponse.json({
            success: true,
            connection: {
                id: connection.id,
                shopDomain: connection.shopDomain,
                isConnected: connection.isConnected,
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Error saving Shopify connection:', error)
        return NextResponse.json(
            { error: 'Failed to save connection' },
            { status: 500 }
        )
    }
}

// DELETE - Disconnect Shopify
export async function DELETE() {
    try {
        await prisma.shopifyConnection.deleteMany({})

        return NextResponse.json({
            success: true,
            message: 'Shopify disconnected successfully'
        })
    } catch (error) {
        console.error('Error disconnecting Shopify:', error)
        return NextResponse.json(
            { error: 'Failed to disconnect' },
            { status: 500 }
        )
    }
}
