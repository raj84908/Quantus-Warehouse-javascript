# Convenience Store POS Integration System
## Complete Implementation Guide

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technical Requirements](#technical-requirements)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [POS Integration Methods](#pos-integration-methods)
7. [Security Implementation](#security-implementation)
8. [Multi-Store & Multi-Tenant Support](#multi-store--multi-tenant-support)
9. [UI/UX Design Guidelines](#uiux-design-guidelines)
10. [Business Features](#business-features)
11. [Deployment & Scaling](#deployment--scaling)
12. [Pricing Model](#pricing-model)

---

## 🎯 Overview

### **Product Vision**
A dedicated **Convenience Store Inventory Management System** that integrates with Point of Sale (POS) systems to provide real-time inventory tracking, automatic stock deduction, multi-store management, and business analytics.

### **Key Differentiators**
- ✅ Real-time inventory sync with POS systems
- ✅ Multi-store management for chain operations
- ✅ Clean, intuitive UI designed for convenience store owners
- ✅ Automatic low-stock alerts via SMS/Email
- ✅ Sales analytics and reporting
- ✅ Mobile-friendly dashboard
- ✅ Multi-tenant SaaS architecture

---

## 🏗️ System Architecture

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     Convenience Store Chain                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Store 1    │  │   Store 2    │  │   Store 3    │     │
│  │   POS System │  │   POS System │  │   POS System │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          │ Webhooks (HTTPS) │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Your SaaS Platform (Cloud)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Webhook Receiver API                     │  │
│  │  - Signature Verification                             │  │
│  │  - Rate Limiting                                      │  │
│  │  - Idempotency Checks                                 │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │         Inventory Processing Engine                   │  │
│  │  - Stock Deduction (Transactional)                    │  │
│  │  - Multi-Store Allocation                             │  │
│  │  - Low Stock Detection                                │  │
│  │  - Audit Trail Creation                               │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │         PostgreSQL Database (Multi-Tenant)            │  │
│  │  - Organizations                                       │  │
│  │  - Stores                                              │  │
│  │  - Products                                            │  │
│  │  - Inventory Transactions                              │  │
│  │  - Stock Adjustments                                   │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │          Real-Time Dashboard & Analytics              │  │
│  │  - Live Sales Feed                                     │  │
│  │  - Store Performance                                   │  │
│  │  - Inventory Alerts                                    │  │
│  │  - Predictive Reordering                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │  Email   │      │   SMS    │      │  Mobile  │
    │  Alerts  │      │  Alerts  │      │   App    │
    └──────────┘      └──────────┘      └──────────┘
```

---

## 🔧 Technical Requirements

### **Tech Stack**

#### **Frontend**
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** React 18+
- **Styling:** TailwindCSS + Shadcn/ui components
- **State Management:** React Query (TanStack Query)
- **Charts:** Recharts or Chart.js
- **Real-time:** WebSockets (Socket.io or Pusher)
- **Mobile:** Responsive-first design (PWA capable)

#### **Backend**
- **Runtime:** Node.js 20+
- **Framework:** Next.js API Routes
- **Database:** PostgreSQL 15+
- **ORM:** Prisma 5+
- **Authentication:** NextAuth.js (JWT + Session)
- **Queue:** BullMQ (for async processing)
- **Cache:** Redis (for rate limiting & caching)

#### **Infrastructure**
- **Hosting:** Vercel (Frontend + API) or AWS/GCP
- **Database:** Supabase, Railway, or AWS RDS
- **Storage:** AWS S3 (for receipts, reports)
- **CDN:** Cloudflare
- **Monitoring:** Sentry (error tracking), Datadog (metrics)

---

## 🗄️ Database Schema

### **Enhanced Multi-Tenant Schema**

```prisma
// prisma/schema.prisma

// ============================================
// MULTI-TENANT CORE
// ============================================

model Organization {
  id                  Int                   @id @default(autoincrement())
  name                String
  slug                String                @unique
  subscriptionTier    String                @default("free") // free, basic, pro, enterprise
  subscriptionStatus  String                @default("active") // active, suspended, cancelled
  maxStores           Int                   @default(1)
  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt

  // Relations
  users               AuthUser[]
  stores              Store[]
  products            Product[]
  categories          Category[]
  suppliers           Supplier[]
  posConnections      POSConnection[]
  notifications       NotificationSetting[]

  @@index([slug])
}

model AuthUser {
  id             Int      @id @default(autoincrement())
  name           String
  email          String   @unique
  password       String
  role           String   @default("user") // admin, manager, staff
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id])
  storeAccess    StoreAccess[] // Which stores can this user access
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([email])
  @@index([organizationId])
}

// ============================================
// STORE MANAGEMENT
// ============================================

model Store {
  id                  Int                   @id @default(autoincrement())
  storeId             String                @unique // External store identifier
  name                String
  address             String?
  city                String?
  state               String?
  zipCode             String?
  phone               String?
  email               String?
  timezone            String                @default("America/New_York")
  status              String                @default("active") // active, inactive, maintenance
  organizationId      Int
  organization        Organization          @relation(fields: [organizationId], references: [id])

  // Relations
  inventory           StoreInventory[]
  transactions        InventoryTransaction[]
  posConnections      POSConnection[]
  storeAccess         StoreAccess[]

  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt

  @@index([organizationId])
  @@index([storeId])
}

model StoreAccess {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      AuthUser @relation(fields: [userId], references: [id])
  storeId   Int
  store     Store    @relation(fields: [storeId], references: [id])
  role      String   @default("viewer") // owner, manager, viewer

  @@unique([userId, storeId])
}

// ============================================
// PRODUCT CATALOG
// ============================================

model Product {
  id                  Int                   @id @default(autoincrement())
  sku                 String                // Universal SKU
  upc                 String?               // Barcode
  name                String
  description         String?
  categoryId          Int?
  category            Category?             @relation(fields: [categoryId], references: [id])
  supplierId          Int?
  supplier            Supplier?             @relation(fields: [supplierId], references: [id])

  // Pricing
  costPrice           Float                 @default(0)
  salePrice           Float
  msrp                Float?

  // Inventory Settings
  unit                String                @default("unit") // unit, pack, case, lb, oz
  reorderPoint        Int                   @default(10)
  reorderQuantity     Int                   @default(24)

  // Product Details
  brand               String?
  size                String?
  imageUrl            String?
  taxable             Boolean               @default(true)

  organizationId      Int
  organization        Organization          @relation(fields: [organizationId], references: [id])

  // Relations
  storeInventory      StoreInventory[]
  skuMappings         SKUMapping[]
  transactions        InventoryTransaction[]

  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt

  @@unique([sku, organizationId])
  @@index([organizationId])
  @@index([categoryId])
}

model Category {
  id             Int           @id @default(autoincrement())
  name           String
  description    String?
  parentId       Int?
  parent         Category?     @relation("CategoryToCategory", fields: [parentId], references: [id])
  children       Category[]    @relation("CategoryToCategory")
  organizationId Int
  organization   Organization  @relation(fields: [organizationId], references: [id])
  products       Product[]

  @@index([organizationId])
}

model Supplier {
  id             Int           @id @default(autoincrement())
  name           String
  contactName    String?
  email          String?
  phone          String?
  address        String?
  website        String?
  notes          String?
  organizationId Int
  organization   Organization  @relation(fields: [organizationId], references: [id])
  products       Product[]

  @@index([organizationId])
}

// ============================================
// INVENTORY MANAGEMENT
// ============================================

model StoreInventory {
  id                  Int                   @id @default(autoincrement())
  storeId             Int
  store               Store                 @relation(fields: [storeId], references: [id], onDelete: Cascade)
  productId           Int
  product             Product               @relation(fields: [productId], references: [id], onDelete: Cascade)

  // Stock Levels
  quantityOnHand      Int                   @default(0)
  quantityReserved    Int                   @default(0) // Reserved for online orders
  quantityAvailable   Int                   @default(0) // onHand - reserved

  // Location
  aisle               String?
  shelf               String?
  bin                 String?

  // Status
  status              String                @default("IN_STOCK") // IN_STOCK, LOW_STOCK, OUT_OF_STOCK
  lastRestocked       DateTime?
  lastSold            DateTime?

  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt

  @@unique([storeId, productId])
  @@index([storeId])
  @@index([productId])
  @@index([status])
}

model InventoryTransaction {
  id                  Int                   @id @default(autoincrement())
  transactionId       String                @unique // POS transaction ID or internal ID
  transactionType     String                // SALE, RETURN, ADJUSTMENT, RESTOCK, TRANSFER, DAMAGE
  storeId             Int
  store               Store                 @relation(fields: [storeId], references: [id])
  productId           Int
  product             Product               @relation(fields: [productId], references: [id])

  // Quantities
  quantity            Int
  previousStock       Int
  newStock            Int

  // Transaction Details
  reason              String?
  notes               String?
  posTransactionId    String?               // Link to POS transaction
  batchNumber         String?
  expirationDate      DateTime?

  // Metadata
  performedBy         String                @default("System")
  source              String                @default("manual") // manual, pos, api, system

  createdAt           DateTime              @default(now())

  @@index([storeId])
  @@index([productId])
  @@index([transactionType])
  @@index([createdAt])
  @@index([posTransactionId])
}

// ============================================
// POS INTEGRATION
// ============================================

model POSConnection {
  id                  Int                   @id @default(autoincrement())
  organizationId      Int
  organization        Organization          @relation(fields: [organizationId], references: [id])
  storeId             Int
  store               Store                 @relation(fields: [storeId], references: [id])

  // POS System Details
  posProvider         String                // square, clover, toast, lightspeed, custom
  posStoreId          String                // External store ID in POS system

  // Credentials (encrypted)
  apiKey              String?
  apiSecret           String?
  webhookSecret       String
  accessToken         String?
  refreshToken        String?

  // Settings
  syncEnabled         Boolean               @default(true)
  syncInterval        Int                   @default(300) // seconds
  lastSyncAt          DateTime?
  lastSyncStatus      String?               // success, failed, pending

  // Webhook Configuration
  webhookUrl          String?
  webhookEvents       Json?                 // Array of subscribed events

  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt

  @@unique([organizationId, storeId])
  @@index([organizationId])
  @@index([storeId])
}

model SKUMapping {
  id                  Int                   @id @default(autoincrement())
  productId           Int
  product             Product               @relation(fields: [productId], references: [id], onDelete: Cascade)
  posProvider         String                // square, clover, etc.
  posSKU              String                // SKU in POS system
  posProductId        String?               // Product ID in POS system

  @@unique([productId, posProvider])
  @@index([posSKU])
}

model WebhookLog {
  id                  Int                   @id @default(autoincrement())
  webhookId           String                @unique
  provider            String
  event               String
  payload             Json
  signature           String?
  status              String                // pending, processed, failed, duplicate
  errorMessage        String?
  processedAt         DateTime?
  retryCount          Int                   @default(0)

  createdAt           DateTime              @default(now())

  @@index([status])
  @@index([createdAt])
  @@index([provider])
}

// ============================================
// NOTIFICATIONS & ALERTS
// ============================================

model NotificationSetting {
  id                  Int                   @id @default(autoincrement())
  organizationId      Int
  organization        Organization          @relation(fields: [organizationId], references: [id])

  // Low Stock Alerts
  lowStockEnabled     Boolean               @default(true)
  lowStockThreshold   Int                   @default(10)
  lowStockChannels    Json                  // ["email", "sms", "push"]

  // Out of Stock Alerts
  outOfStockEnabled   Boolean               @default(true)
  outOfStockChannels  Json

  // High Sales Alerts
  highSalesEnabled    Boolean               @default(false)
  highSalesThreshold  Int?

  // Contact Information
  alertEmails         Json                  // Array of email addresses
  alertPhones         Json                  // Array of phone numbers

  createdAt           DateTime              @default(now())
  updatedAt           DateTime              @updatedAt

  @@unique([organizationId])
}

model Alert {
  id                  Int                   @id @default(autoincrement())
  organizationId      Int
  storeId             Int?
  productId           Int?

  alertType           String                // LOW_STOCK, OUT_OF_STOCK, HIGH_DEMAND, EXPIRING_SOON
  severity            String                @default("medium") // low, medium, high, critical
  title               String
  message             String

  status              String                @default("active") // active, acknowledged, resolved
  acknowledgedAt      DateTime?
  acknowledgedBy      String?
  resolvedAt          DateTime?

  createdAt           DateTime              @default(now())

  @@index([organizationId])
  @@index([status])
  @@index([alertType])
}
```

---

## 🔌 API Endpoints

### **Webhook Endpoint for POS Integration**

**File:** `app/api/webhooks/pos/sale/route.js`

```javascript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendLowStockAlert } from '@/lib/notifications'

// POST /api/webhooks/pos/sale
export async function POST(request) {
    const startTime = Date.now()

    try {
        // ============================================
        // STEP 1: PARSE AND VALIDATE REQUEST
        // ============================================

        const body = await request.json()
        const signature = request.headers.get('x-pos-signature')
        const provider = request.headers.get('x-pos-provider') || 'custom'

        console.log(`[POS Webhook] Received from ${provider}:`, {
            transactionId: body.transactionId,
            itemCount: body.items?.length
        })

        // ============================================
        // STEP 2: VERIFY WEBHOOK AUTHENTICITY
        // ============================================

        // Get POS connection to retrieve webhook secret
        const posConnection = await prisma.pOSConnection.findFirst({
            where: {
                posStoreId: body.storeId,
                posProvider: provider
            }
        })

        if (!posConnection) {
            console.error('[POS Webhook] Store not found:', body.storeId)
            return NextResponse.json({
                error: 'Store not configured'
            }, { status: 404 })
        }

        // Verify HMAC signature
        const expectedSignature = crypto
            .createHmac('sha256', posConnection.webhookSecret)
            .update(JSON.stringify(body))
            .digest('hex')

        if (signature !== expectedSignature) {
            console.error('[POS Webhook] Invalid signature')
            return NextResponse.json({
                error: 'Invalid signature'
            }, { status: 401 })
        }

        // ============================================
        // STEP 3: CHECK FOR DUPLICATE WEBHOOKS
        // ============================================

        const existingWebhook = await prisma.webhookLog.findUnique({
            where: { webhookId: body.transactionId }
        })

        if (existingWebhook && existingWebhook.status === 'processed') {
            console.log('[POS Webhook] Duplicate webhook, already processed')
            return NextResponse.json({
                success: true,
                message: 'Already processed',
                transactionId: body.transactionId
            })
        }

        // Create webhook log entry
        await prisma.webhookLog.create({
            data: {
                webhookId: body.transactionId,
                provider: provider,
                event: 'sale.completed',
                payload: body,
                signature: signature,
                status: 'pending'
            }
        })

        // ============================================
        // STEP 4: VALIDATE PAYLOAD
        // ============================================

        if (!body.storeId || !body.items || !Array.isArray(body.items)) {
            await prisma.webhookLog.update({
                where: { webhookId: body.transactionId },
                data: {
                    status: 'failed',
                    errorMessage: 'Missing required fields'
                }
            })
            return NextResponse.json({
                error: 'Missing required fields: storeId, items'
            }, { status: 400 })
        }

        // ============================================
        // STEP 5: PROCESS INVENTORY TRANSACTION
        // ============================================

        const result = await prisma.$transaction(async (tx) => {
            const adjustments = []
            const alerts = []

            // Find the store
            const store = await tx.store.findUnique({
                where: { storeId: body.storeId },
                include: { organization: true }
            })

            if (!store) {
                throw new Error(`Store ${body.storeId} not found`)
            }

            // Process each item in the sale
            for (const item of body.items) {
                try {
                    // Find product by SKU mapping
                    const skuMapping = await tx.sKUMapping.findFirst({
                        where: {
                            posSKU: item.sku,
                            posProvider: provider
                        },
                        include: { product: true }
                    })

                    // If no mapping, try direct SKU match
                    const product = skuMapping?.product || await tx.product.findFirst({
                        where: {
                            sku: item.sku,
                            organizationId: store.organizationId
                        }
                    })

                    if (!product) {
                        console.warn(`[POS Webhook] Product not found: ${item.sku}`)
                        continue
                    }

                    // Get current inventory for this store
                    const inventory = await tx.storeInventory.findUnique({
                        where: {
                            storeId_productId: {
                                storeId: store.id,
                                productId: product.id
                            }
                        }
                    })

                    if (!inventory) {
                        console.warn(`[POS Webhook] Inventory not found for product ${product.sku} at store ${store.storeId}`)
                        continue
                    }

                    // Calculate new stock levels
                    const newQuantityOnHand = Math.max(0, inventory.quantityOnHand - item.quantity)
                    const newQuantityAvailable = Math.max(0, newQuantityOnHand - inventory.quantityReserved)

                    // Determine new status
                    let newStatus = 'IN_STOCK'
                    if (newQuantityOnHand <= 0) {
                        newStatus = 'OUT_OF_STOCK'
                    } else if (newQuantityOnHand <= product.reorderPoint) {
                        newStatus = 'LOW_STOCK'
                    }

                    // Update inventory
                    await tx.storeInventory.update({
                        where: {
                            storeId_productId: {
                                storeId: store.id,
                                productId: product.id
                            }
                        },
                        data: {
                            quantityOnHand: newQuantityOnHand,
                            quantityAvailable: newQuantityAvailable,
                            status: newStatus,
                            lastSold: new Date()
                        }
                    })

                    // Create inventory transaction record
                    await tx.inventoryTransaction.create({
                        data: {
                            transactionId: `${body.transactionId}-${item.sku}`,
                            transactionType: 'SALE',
                            storeId: store.id,
                            productId: product.id,
                            quantity: -item.quantity,
                            previousStock: inventory.quantityOnHand,
                            newStock: newQuantityOnHand,
                            reason: 'POS Sale',
                            notes: `POS Transaction: ${body.transactionId}`,
                            posTransactionId: body.transactionId,
                            performedBy: 'POS System',
                            source: 'pos'
                        }
                    })

                    adjustments.push({
                        sku: product.sku,
                        name: product.name,
                        previousStock: inventory.quantityOnHand,
                        newStock: newQuantityOnHand,
                        quantitySold: item.quantity,
                        status: newStatus
                    })

                    // Create alerts for low/out of stock
                    if (newStatus === 'OUT_OF_STOCK') {
                        await tx.alert.create({
                            data: {
                                organizationId: store.organizationId,
                                storeId: store.id,
                                productId: product.id,
                                alertType: 'OUT_OF_STOCK',
                                severity: 'critical',
                                title: `${product.name} is out of stock`,
                                message: `${product.name} (${product.sku}) at ${store.name} is now out of stock after recent sale.`,
                                status: 'active'
                            }
                        })
                        alerts.push({ type: 'OUT_OF_STOCK', product: product.name })
                    } else if (newStatus === 'LOW_STOCK') {
                        await tx.alert.create({
                            data: {
                                organizationId: store.organizationId,
                                storeId: store.id,
                                productId: product.id,
                                alertType: 'LOW_STOCK',
                                severity: 'high',
                                title: `${product.name} is low on stock`,
                                message: `${product.name} (${product.sku}) at ${store.name} is running low (${newQuantityOnHand} remaining). Reorder point: ${product.reorderPoint}`,
                                status: 'active'
                            }
                        })
                        alerts.push({ type: 'LOW_STOCK', product: product.name, remaining: newQuantityOnHand })
                    }

                } catch (itemError) {
                    console.error(`[POS Webhook] Error processing item ${item.sku}:`, itemError)
                    // Continue processing other items
                }
            }

            // Update POS connection sync status
            await tx.pOSConnection.update({
                where: { id: posConnection.id },
                data: {
                    lastSyncAt: new Date(),
                    lastSyncStatus: 'success'
                }
            })

            return { adjustments, alerts }
        })

        // ============================================
        // STEP 6: UPDATE WEBHOOK LOG
        // ============================================

        await prisma.webhookLog.update({
            where: { webhookId: body.transactionId },
            data: {
                status: 'processed',
                processedAt: new Date()
            }
        })

        // ============================================
        // STEP 7: SEND NOTIFICATIONS (ASYNC)
        // ============================================

        if (result.alerts.length > 0) {
            // Send alerts in background (don't block webhook response)
            setImmediate(async () => {
                try {
                    await sendLowStockAlert(posConnection.organizationId, result.alerts)
                } catch (alertError) {
                    console.error('[POS Webhook] Error sending alerts:', alertError)
                }
            })
        }

        // ============================================
        // STEP 8: RETURN SUCCESS RESPONSE
        // ============================================

        const processingTime = Date.now() - startTime
        console.log(`[POS Webhook] Processed successfully in ${processingTime}ms`)

        return NextResponse.json({
            success: true,
            transactionId: body.transactionId,
            itemsProcessed: result.adjustments.length,
            adjustments: result.adjustments,
            alerts: result.alerts,
            processingTimeMs: processingTime
        }, { status: 200 })

    } catch (error) {
        console.error('[POS Webhook] Error:', error)

        // Update webhook log with error
        if (body?.transactionId) {
            await prisma.webhookLog.update({
                where: { webhookId: body.transactionId },
                data: {
                    status: 'failed',
                    errorMessage: error.message
                }
            }).catch(err => console.error('Failed to update webhook log:', err))
        }

        return NextResponse.json({
            error: 'Failed to process webhook',
            message: error.message
        }, { status: 500 })
    }
}

// GET /api/webhooks/pos/sale - Health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'pos-webhook',
        timestamp: new Date().toISOString()
    })
}
```

---

## 🔐 Security Implementation

### **1. Webhook Signature Verification**

**File:** `lib/webhooks/verify.js`

```javascript
import crypto from 'crypto'

export function verifyWebhookSignature(payload, signature, secret, algorithm = 'sha256') {
    const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
        .digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    )
}

// Provider-specific signature verification
export const signatureVerifiers = {
    square: (payload, signature, secret) => {
        // Square uses HMAC-SHA256 with body + URL
        const combined = payload + process.env.SQUARE_WEBHOOK_URL
        return verifyWebhookSignature(combined, signature, secret)
    },

    clover: (payload, signature, secret) => {
        // Clover uses HMAC-SHA256
        return verifyWebhookSignature(payload, signature, secret)
    },

    shopify: (payload, signature, secret) => {
        // Shopify uses HMAC-SHA256 with base64 encoding
        const hash = crypto
            .createHmac('sha256', secret)
            .update(payload, 'utf8')
            .digest('base64')
        return hash === signature
    }
}
```

### **2. Rate Limiting**

**File:** `lib/ratelimit.js`

```javascript
import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
})

export async function rateLimit(identifier, limit = 100, window = 60) {
    const key = `ratelimit:${identifier}`
    const now = Date.now()
    const windowStart = now - (window * 1000)

    // Use Redis sorted set for sliding window rate limiting
    const pipeline = redis.pipeline()

    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart)

    // Count requests in current window
    pipeline.zcard(key)

    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` })

    // Set expiration
    pipeline.expire(key, window)

    const results = await pipeline.exec()
    const count = results[1] as number

    return {
        success: count < limit,
        limit,
        remaining: Math.max(0, limit - count - 1),
        reset: new Date(now + (window * 1000))
    }
}

// Webhook-specific rate limiter
export async function webhookRateLimit(storeId, provider) {
    const identifier = `webhook:${provider}:${storeId}`
    return rateLimit(identifier, 1000, 60) // 1000 requests per minute per store
}
```

### **3. Idempotency**

**File:** `lib/webhooks/idempotency.js`

```javascript
import { prisma } from '@/lib/prisma'

export async function ensureIdempotency(webhookId, provider) {
    const existing = await prisma.webhookLog.findUnique({
        where: { webhookId }
    })

    if (existing) {
        if (existing.status === 'processed') {
            return {
                isDuplicate: true,
                result: existing.payload
            }
        } else if (existing.status === 'pending') {
            // Wait for concurrent request to finish
            return {
                isProcessing: true
            }
        } else if (existing.status === 'failed' && existing.retryCount < 3) {
            // Allow retry
            await prisma.webhookLog.update({
                where: { webhookId },
                data: {
                    retryCount: { increment: 1 },
                    status: 'pending'
                }
            })
            return {
                isRetry: true,
                retryCount: existing.retryCount + 1
            }
        }
    }

    return {
        isDuplicate: false,
        isProcessing: false,
        isRetry: false
    }
}
```

---

## 🏪 Multi-Store & Multi-Tenant Support

### **Store Selection UI**

**Component:** `components/StoreSelector.jsx`

```jsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Store, MapPin } from 'lucide-react'

export function StoreSelector({ onStoreChange }) {
  const { data: session } = useSession()
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)

  useEffect(() => {
    if (session?.user) {
      fetchStores()
    }
  }, [session])

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores')
      const data = await response.json()
      setStores(data)

      // Auto-select first store if only one
      if (data.length === 1) {
        setSelectedStore(data[0].id)
        onStoreChange?.(data[0])
      }

      // Restore last selected store from localStorage
      const lastStoreId = localStorage.getItem('selectedStoreId')
      if (lastStoreId) {
        const store = data.find(s => s.id === parseInt(lastStoreId))
        if (store) {
          setSelectedStore(store.id)
          onStoreChange?.(store)
        }
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    }
  }

  const handleStoreChange = (storeId) => {
    const store = stores.find(s => s.id === parseInt(storeId))
    setSelectedStore(storeId)
    localStorage.setItem('selectedStoreId', storeId)
    onStoreChange?.(store)
  }

  if (stores.length === 0) return null

  if (stores.length === 1) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        <span>{stores[0].name}</span>
      </div>
    )
  }

  return (
    <Select value={selectedStore?.toString()} onValueChange={handleStoreChange}>
      <SelectTrigger className="w-[250px]">
        <Store className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select a store" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id.toString()}>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium">{store.name}</div>
                {store.address && (
                  <div className="text-xs text-muted-foreground">
                    {store.city}, {store.state}
                  </div>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

---

## 🎨 UI/UX Design Guidelines

### **Design Principles**

1. **Clean & Minimalist**
   - White space-heavy
   - Clear hierarchy
   - No clutter

2. **Mobile-First**
   - Responsive on all devices
   - Touch-friendly buttons (min 44x44px)
   - Bottom navigation on mobile

3. **Fast Loading**
   - Skeleton loaders
   - Optimistic UI updates
   - Image lazy loading

4. **Data Visualization**
   - Charts for trends
   - Color-coded status indicators
   - Progress bars for stock levels

5. **Accessibility**
   - WCAG 2.1 AA compliant
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

### **Color Palette**

```css
/* colors.css */

:root {
  /* Brand Colors */
  --brand-primary: #2563eb; /* Blue */
  --brand-secondary: #10b981; /* Green */
  --brand-accent: #f59e0b; /* Amber */

  /* Status Colors */
  --status-success: #10b981; /* Green */
  --status-warning: #f59e0b; /* Amber */
  --status-danger: #ef4444; /* Red */
  --status-info: #3b82f6; /* Blue */

  /* Stock Status Colors */
  --stock-in: #10b981; /* Green */
  --stock-low: #f59e0b; /* Amber */
  --stock-out: #ef4444; /* Red */

  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### **Dashboard Layout**

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard           [Store Selector ▼]  [User Menu]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Total Sales  │  │ Today's Sales│  │  Low Stock   │      │
│  │   $12,458    │  │    $1,234    │  │   12 Items   │      │
│  │   ▲ 12%      │  │   ▼ 5%       │  │   ⚠ Alert    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Sales Trend (Last 7 Days)                │   │
│  │   [Line Chart]                                        │   │
│  │                                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  Recent Transactions │  │   Low Stock Alerts       │    │
│  │  - Item A sold (3)   │  │   • Coke 12oz (5 left)   │    │
│  │  - Item B sold (1)   │  │   • Chips (2 left)       │    │
│  │  - Item C restocked  │  │   • Energy Drink (0 left)│    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 💼 Business Features

### **1. Predictive Reordering**

```javascript
// lib/analytics/predictive-reorder.js

export async function calculateReorderSuggestions(storeId) {
    const products = await prisma.product.findMany({
        where: {
            storeInventory: {
                some: { storeId }
            }
        },
        include: {
            storeInventory: {
                where: { storeId }
            }
        }
    })

    const suggestions = []

    for (const product of products) {
        const inventory = product.storeInventory[0]

        // Get sales velocity (items sold per day)
        const salesHistory = await prisma.inventoryTransaction.findMany({
            where: {
                productId: product.id,
                storeId,
                transactionType: 'SALE',
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            }
        })

        const totalSold = salesHistory.reduce((sum, t) => sum + Math.abs(t.quantity), 0)
        const daysOfData = 30
        const dailyVelocity = totalSold / daysOfData

        // Calculate days until out of stock
        const daysUntilEmpty = dailyVelocity > 0 ? inventory.quantityOnHand / dailyVelocity : Infinity

        // Suggest reorder if less than 7 days of stock remaining
        if (daysUntilEmpty < 7 && inventory.quantityOnHand > 0) {
            suggestions.push({
                product,
                currentStock: inventory.quantityOnHand,
                dailyVelocity: Math.round(dailyVelocity * 10) / 10,
                daysRemaining: Math.round(daysUntilEmpty),
                suggestedOrderQuantity: product.reorderQuantity,
                urgency: daysUntilEmpty < 3 ? 'high' : 'medium'
            })
        }
    }

    return suggestions.sort((a, b) => a.daysRemaining - b.daysRemaining)
}
```

### **2. Multi-Channel Notifications**

```javascript
// lib/notifications/send.js

import twilio from 'twilio'
import nodemailer from 'nodemailer'

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
)

const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

export async function sendLowStockAlert(organizationId, alerts) {
    // Get notification settings
    const settings = await prisma.notificationSetting.findUnique({
        where: { organizationId }
    })

    if (!settings || !settings.lowStockEnabled) return

    const channels = settings.lowStockChannels

    // Send Email
    if (channels.includes('email')) {
        for (const email of settings.alertEmails) {
            await emailTransporter.sendMail({
                from: '"Inventory Alerts" <alerts@yourapp.com>',
                to: email,
                subject: `⚠️ Low Stock Alert - ${alerts.length} items`,
                html: generateAlertEmailHTML(alerts)
            })
        }
    }

    // Send SMS
    if (channels.includes('sms')) {
        for (const phone of settings.alertPhones) {
            const message = `Low Stock Alert: ${alerts.map(a => a.product).join(', ')}`
            await twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone
            })
        }
    }
}

function generateAlertEmailHTML(alerts) {
    return `
        <h2>Low Stock Alert</h2>
        <p>The following items are running low:</p>
        <ul>
            ${alerts.map(alert => `
                <li>
                    <strong>${alert.product}</strong>
                    ${alert.remaining ? `- ${alert.remaining} remaining` : '- OUT OF STOCK'}
                </li>
            `).join('')}
        </ul>
        <p>Consider restocking these items soon.</p>
    `
}
```

---

## 🚀 Deployment & Scaling

### **Deployment Checklist**

```bash
# 1. Environment Setup
cp .env.example .env.production
# Configure all production variables

# 2. Database Migration
npx prisma migrate deploy

# 3. Build Application
npm run build

# 4. Deploy to Vercel
vercel --prod

# 5. Setup Monitoring
# - Configure Sentry
# - Setup Uptime monitoring
# - Enable error tracking

# 6. Performance Optimization
# - Enable CDN caching
# - Configure Redis cache
# - Setup webhook queue (BullMQ)
```

### **Scaling Strategy**

**Phase 1: 0-100 stores**
- Single Vercel deployment
- Supabase PostgreSQL
- Upstash Redis

**Phase 2: 100-1000 stores**
- Multiple Vercel regions
- AWS RDS with read replicas
- Dedicated Redis cluster
- Webhook processing queue

**Phase 3: 1000+ stores**
- Microservices architecture
- Kubernetes cluster
- Sharded database
- Event-driven architecture
- Message queues (Kafka/RabbitMQ)

---

## 💰 Pricing Model

### **Subscription Tiers**

**Free Tier**
- 1 store
- Basic inventory tracking
- Manual stock updates
- Email alerts only
- 30-day history

**Basic - $49/month**
- Up to 3 stores
- POS integration (1 provider)
- Real-time sync
- Email + SMS alerts
- 90-day history
- Basic analytics

**Pro - $149/month**
- Up to 10 stores
- POS integration (all providers)
- Real-time sync
- Multi-channel alerts
- Unlimited history
- Advanced analytics
- Predictive reordering
- API access

**Enterprise - Custom**
- Unlimited stores
- White-label option
- Dedicated support
- Custom integrations
- SLA guarantees
- On-premise deployment

### **Add-ons**
- Additional stores: $10/month each
- SMS alerts: $5/month per 100 messages
- Advanced analytics: $29/month
- API access: $49/month

---

## 📚 Implementation Roadmap

### **Phase 1: MVP (4-6 weeks)**
- ✅ Multi-tenant authentication
- ✅ Store management
- ✅ Product catalog
- ✅ Basic inventory tracking
- ✅ Manual stock adjustments
- ✅ Simple dashboard

### **Phase 2: POS Integration (4-6 weeks)**
- ✅ Webhook infrastructure
- ✅ Square integration
- ✅ Clover integration
- ✅ Real-time sync
- ✅ Transaction logging
- ✅ Error handling & retry logic

### **Phase 3: Alerts & Analytics (3-4 weeks)**
- ✅ Low stock alerts
- ✅ Email notifications
- ✅ SMS notifications
- ✅ Sales analytics
- ✅ Inventory reports
- ✅ Predictive reordering

### **Phase 4: Mobile & Advanced Features (4-6 weeks)**
- ✅ Mobile app (React Native)
- ✅ Barcode scanning
- ✅ Advanced analytics
- ✅ Multi-store transfers
- ✅ Supplier management
- ✅ Purchase orders

### **Phase 5: Enterprise Features (Ongoing)**
- ✅ White-label support
- ✅ Custom integrations
- ✅ Advanced permissions
- ✅ Audit logs
- ✅ Compliance features

---

## 🎓 Best Practices

1. **Always use transactions for inventory operations**
2. **Implement idempotency for all webhooks**
3. **Use signature verification for all POS webhooks**
4. **Rate limit webhook endpoints**
5. **Log all inventory transactions for audit trail**
6. **Send alerts asynchronously (don't block webhooks)**
7. **Use Redis for caching frequently accessed data**
8. **Implement proper error handling and retry logic**
9. **Monitor webhook processing times**
10. **Test with production-like data volumes**

---

## 📞 Support & Documentation

- **Documentation:** https://docs.yourapp.com
- **API Reference:** https://api.yourapp.com/docs
- **Community:** https://community.yourapp.com
- **Status Page:** https://status.yourapp.com
- **Support:** support@yourapp.com

---

**Last Updated:** January 2025
**Version:** 1.0.0
