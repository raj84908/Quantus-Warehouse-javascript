import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
    const products = await prisma.product.findMany()
    return NextResponse.json(products)
}

export async function POST(req) {
    const data = await req.json()

    try {
        const newProduct = await prisma.product.create({
            data: {
                sku: data.sku,
                name: data.name,
                category: data.category,
                stock: data.stock,
                minStock: data.minStock,
                location: data.location,
                value: data.value,
                status: data.status,
                lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
            },
        })
        return NextResponse.json(newProduct, { status: 201 })
    } catch (error) {
        console.error("Failed to create product:", error)
        return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
    }
}
