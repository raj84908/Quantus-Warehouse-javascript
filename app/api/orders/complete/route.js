import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

export async function GET() {
    const products = await prisma.product.findMany()
    return NextResponse.json(products)
}

export async function POST(req) {
    try {
        const data = await req.json()
        let imageUrl = null

        if (data.image) {
            // Decode Base64
            const base64Data = data.image.replace(/^data:image\/\w+;base64,/, "")
            const buffer = Buffer.from(base64Data, "base64")

            // Ensure upload folder exists
            const uploadDir = path.join(process.cwd(), "public/uploads")
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }

            // Save file
            const fileName = `${Date.now()}-${data.sku}.png`
            const filePath = path.join(uploadDir, fileName)
            fs.writeFileSync(filePath, buffer)

            // Store relative path
            imageUrl = `/uploads/${fileName}`
        }

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
                imageUrl,
            },
        })

        return NextResponse.json(newProduct, { status: 201 })
    } catch (error) {
        console.error("Failed to create product:", error)
        return NextResponse.json({ error: "Failed to add product" }, { status: 500 })
    }
}
