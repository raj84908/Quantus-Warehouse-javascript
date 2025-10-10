import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth'

// GET /api/invoice-settings - Get invoice settings (filtered by organization)
export const GET = withAuth(async (request, { user }) => {
    try {
        let settings = await prisma.invoiceSettings.findFirst({
            where: {
                organizationId: user.organizationId
            }
        })

        // If no settings exist, create default ones for this organization
        if (!settings) {
            settings = await prisma.invoiceSettings.create({
                data: {
                    companyName: user.organizationName || "Your Company",
                    primaryColor: "#8B5A3C",
                    secondaryColor: "#F5F5F5",
                    textColor: "#FFFFFF",
                    invoiceComments: "Thank you for your business! Please remit payment within 30 days of invoice date. Late payments may be subject to fees.",
                    paymentMethods: "Bank Transfer: [Account Details]\nPayPal: payment@company.com\nCheck: Make payable to Company Name",
                    organizationId: user.organizationId
                }
            })
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error('Error fetching invoice settings:', error)
        return NextResponse.json({ error: 'Failed to fetch invoice settings' }, { status: 500 })
    }
})

// POST /api/invoice-settings - Update invoice settings
export const POST = withAuth(async (request, { user }) => {
    try {
        const data = await request.json()

        // Find existing settings for this organization or create new
        let settings = await prisma.invoiceSettings.findFirst({
            where: {
                organizationId: user.organizationId
            }
        })

        if (settings) {
            // Update existing
            settings = await prisma.invoiceSettings.update({
                where: { id: settings.id },
                data: {
                    companyName: data.companyName || settings.companyName,
                    companyEmail: data.companyEmail || settings.companyEmail,
                    companyPhone: data.companyPhone || settings.companyPhone,
                    companyAddress: data.companyAddress || settings.companyAddress,
                    invoiceComments: data.invoiceComments || settings.invoiceComments,
                    paymentMethods: data.paymentMethods || settings.paymentMethods,
                    logo: data.logo !== undefined ? data.logo : settings.logo,
                    primaryColor: data.primaryColor || settings.primaryColor,
                    secondaryColor: data.secondaryColor || settings.secondaryColor,
                    textColor: data.textColor || settings.textColor
                }
            })
        } else {
            // Create new for this organization
            settings = await prisma.invoiceSettings.create({
                data: {
                    companyName: data.companyName || user.organizationName || "Your Company",
                    companyEmail: data.companyEmail,
                    companyPhone: data.companyPhone,
                    companyAddress: data.companyAddress,
                    invoiceComments: data.invoiceComments || "Thank you for your business! Please remit payment within 30 days of invoice date. Late payments may be subject to fees.",
                    paymentMethods: data.paymentMethods || "Bank Transfer: [Account Details]\nPayPal: payment@company.com\nCheck: Make payable to Company Name",
                    logo: data.logo,
                    primaryColor: data.primaryColor || "#8B5A3C",
                    secondaryColor: data.secondaryColor || "#F5F5F5",
                    textColor: data.textColor || "#FFFFFF",
                    organizationId: user.organizationId
                }
            })
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error('Error updating invoice settings:', error)
        return NextResponse.json({ error: 'Failed to update invoice settings' }, { status: 500 })
    }
})