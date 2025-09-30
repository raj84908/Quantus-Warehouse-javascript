import { prisma } from '@/lib/prisma'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30'
    const days = parseInt(timeRange)

    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - days)

    // Example: fetch top products with calculated revenue and units sold
    const products = await prisma.product.findMany({
        include: {
            orderItems: {
                where: {
                    order: {
                        createdAt: {
                            gte: startDate,
                            lt: endDate,
                        }
                    }
                },
                select: {
                    price: true,
                    quantity: true,
                }
            }
        }
    })

    // Calculate revenue and units for each product
    const result = products.map((product) => {
        const revenue = product.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const units = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)

        // You might calculate change here or add other metrics as needed

        return {
            name: product.name,
            units: `${units} units`,
            revenue,
            change: "+0.0%" // placeholder, replace with your own logic
        }
    })

    return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
    })
}
