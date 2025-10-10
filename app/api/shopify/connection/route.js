import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// GET - Retrieve Shopify connection status and credentials (filtered by organization)
export const GET = withAuth(async (request, { user }) => {
    try {
        const connection = await prisma.shopifyConnection.findFirst({
            where: {
                organizationId: user.organizationId
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!connection) {
            return NextResponse.json({
                isConnected: false,
                connection: null
            })
        }

        // Return connection data
        return NextResponse.json({
            isConnected: connection.isConnected,
            connection: {
                id: connection.id,
                shopDomain: connection.shopDomain,
                lastSyncAt: connection.lastSyncAt,
                createdAt: connection.createdAt,
                updatedAt: connection.updatedAt,
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
})

// POST - Save new Shopify credentials
export const POST = withAuth(async (req, { user }) => {
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

        // Delete existing connection for this organization
        await prisma.shopifyConnection.deleteMany({
            where: {
                organizationId: user.organizationId
            }
        })

        // Create new connection for this organization
        const connection = await prisma.shopifyConnection.create({
            data: {
                shopDomain: cleanDomain,
                accessToken,
                apiKey: apiKey || null,
                apiSecret: apiSecret || null,
                isConnected: true,
                organizationId: user.organizationId
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
})

// DELETE - Disconnect Shopify
export const DELETE = withAuth(async (request, { user }) => {
    try {
        await prisma.shopifyConnection.deleteMany({
            where: {
                organizationId: user.organizationId
            }
        })

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
})
