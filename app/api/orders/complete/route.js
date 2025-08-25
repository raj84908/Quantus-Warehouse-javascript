// app/api/orders/complete/route.js
import { NextResponse } from "next/server"

export async function POST(req) {
    const { orderId } = await req.json()

    // 🔹 Here you’d update your database (or do any backend work).
    console.log(`Marking order ${orderId} as completed`)

    return NextResponse.json({ success: true, message: `Order ${orderId} marked as completed ✅` })
}
