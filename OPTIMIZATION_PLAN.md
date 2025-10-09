# 🚀 Quantus Warehouse - Optimization & Multi-Tenancy Plan

## 📋 Executive Summary

This document outlines a comprehensive plan to transform Quantus Warehouse into a **production-ready, multi-tenant SaaS platform** that can serve multiple businesses simultaneously while maintaining data isolation, security, and optimal performance.

---

## 🏗️ Multi-Tenancy Architecture

### Strategy: Organization-Based Multi-Tenancy

We'll implement **row-level multi-tenancy** where all tenants share the same database and application instance, but data is isolated by `organizationId`. This approach is ideal for Vercel + Neon deployment.

#### Why This Approach?

✅ **Cost-Effective**: Single Neon database instance (free tier supports this)
✅ **Easy Management**: One codebase, one deployment
✅ **Scalable**: Neon's serverless PostgreSQL scales automatically
✅ **Simple Deployment**: Perfect for Vercel's serverless functions
✅ **Fast Development**: No complex infrastructure management

### Alternative Approaches (Not Recommended)

❌ **Database-per-tenant**: Requires Neon's paid plan, complex connection pooling
❌ **Schema-per-tenant**: Difficult to manage migrations, adds overhead
❌ **Separate Instances**: Not cost-effective, hard to maintain

---

## 🗄️ Database Schema Updates

### Core Multi-Tenancy Models

```prisma
// New models to add:

model Organization {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique // e.g., "acme-corp"
  domain          String?  @unique // Custom domain support
  subdomain       String?  @unique // e.g., "acme.quantus.app"

  // Subscription & Billing
  plan            Plan     @default(FREE)
  subscriptionStatus String @default("trial") // trial, active, past_due, canceled
  trialEndsAt     DateTime?
  subscriptionEndsAt DateTime?

  // Settings
  logo            String?
  primaryColor    String   @default("#8B5A3C")
  timezone        String   @default("UTC")
  currency        String   @default("USD")

  // Limits (based on plan)
  maxUsers        Int      @default(5)
  maxProducts     Int      @default(1000)
  maxOrders       Int      @default(5000)

  // Relationships
  users           User[]
  products        Product[]
  orders          Order[]
  categories      Category[]
  shopifyConnections ShopifyConnection[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([slug])
  @@index([subdomain])
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  password        String   // Hashed with bcrypt
  name            String
  avatar          String?

  // Organization relationship
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Role & Permissions
  role            Role     @default(MEMBER)
  permissions     String[] // Array of permission strings

  // Profile
  phone           String?
  department      String?
  position        String?

  // Security
  emailVerified   Boolean  @default(false)
  emailVerifiedAt DateTime?
  lastLoginAt     DateTime?

  // Created data
  createdOrders   Order[]  @relation("CreatedBy")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([email, organizationId])
  @@index([organizationId])
  @@index([email])
}

enum Plan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum Role {
  OWNER       // Full access, billing management
  ADMIN       // Full access except billing
  MANAGER     // Can manage inventory, orders, reports
  MEMBER      // View-only access
  WAREHOUSE   // Can manage inventory and shipments
  SALES       // Can create and manage orders
}
```

### Updated Existing Models

All existing models need `organizationId`:

```prisma
model Product {
  // Add these fields:
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Update unique constraints:
  @@unique([sku, organizationId])
  @@index([organizationId])
  @@index([organizationId, categoryId])
  @@index([organizationId, status])
}

model Order {
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Add creator tracking
  createdById     String?
  createdBy       User? @relation("CreatedBy", fields: [createdById], references: [id])

  @@unique([orderId, organizationId])
  @@index([organizationId])
  @@index([organizationId, status])
}

model ShopifyConnection {
  organizationId  String   @unique // One Shopify connection per organization
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
}
```

---

## 🔐 Authentication & Authorization System

### Recommended: NextAuth.js

```bash
npm install next-auth @auth/prisma-adapter
```

### Features to Implement

1. **Email/Password Authentication**
   - Secure password hashing with bcrypt
   - Password reset flow
   - Email verification

2. **Magic Link Authentication** (Future)
   - Passwordless login via email

3. **OAuth Providers** (Future)
   - Google Sign-In
   - Microsoft Sign-In

4. **Role-Based Access Control (RBAC)**
   ```javascript
   // Middleware example
   export const permissions = {
     'orders:create': ['OWNER', 'ADMIN', 'MANAGER', 'SALES'],
     'orders:view': ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'SALES'],
     'products:manage': ['OWNER', 'ADMIN', 'MANAGER', 'WAREHOUSE'],
     'reports:view': ['OWNER', 'ADMIN', 'MANAGER'],
     'settings:manage': ['OWNER', 'ADMIN'],
     'billing:manage': ['OWNER'],
     'users:manage': ['OWNER', 'ADMIN'],
   }
   ```

5. **Organization Switching**
   - Users can belong to multiple organizations
   - Switch between organizations in UI

---

## ⚡ Performance Optimizations

### 1. Database Indexes

```prisma
// Already included in schema above, but highlighting:

// Product search and filtering
@@index([organizationId, name])
@@index([organizationId, sku])
@@index([organizationId, status])
@@index([organizationId, categoryId])

// Order filtering and search
@@index([organizationId, status])
@@index([organizationId, customer])
@@index([organizationId, createdAt])

// Shopify sync performance
@@index([shopifyProductId])
@@index([shopifyVariantId])
@@index([syncedFromShopify])
```

### 2. Query Optimization

**Before:**
```javascript
// Fetches all fields, no pagination
const products = await prisma.product.findMany()
```

**After:**
```javascript
// Selective fields, pagination, filtering
const products = await prisma.product.findMany({
  where: { organizationId },
  select: {
    id: true,
    sku: true,
    name: true,
    stock: true,
    value: true,
    category: { select: { name: true } }
  },
  take: 50,
  skip: page * 50,
  orderBy: { updatedAt: 'desc' }
})
```

### 3. Caching Strategy

#### Redis for Session & Query Caching (Optional, for scale)

```bash
npm install @upstash/redis
```

```javascript
// lib/cache.js
import { Redis } from '@upstash/redis'

export const cache = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

// Cache expensive queries
export async function getCachedStats(organizationId) {
  const cacheKey = `stats:${organizationId}`

  // Check cache first
  const cached = await cache.get(cacheKey)
  if (cached) return cached

  // Compute if not cached
  const stats = await computeStats(organizationId)

  // Cache for 5 minutes
  await cache.setex(cacheKey, 300, stats)

  return stats
}
```

#### React Query for Client-Side Caching

```bash
npm install @tanstack/react-query
```

```javascript
// app/providers.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})
```

### 4. Neon-Specific Optimizations

```javascript
// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          // Add default pagination to prevent massive queries
          if (!args.take && !args.findFirst) {
            args.take = 100
          }
          return query(args)
        },
      },
    },
  })
}

// Singleton pattern for serverless
const globalForPrisma = globalThis
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 5. API Route Optimizations

```javascript
// Implement response streaming for large datasets
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const organizationId = await getOrgId(request)

  const stream = new ReadableStream({
    async start(controller) {
      const products = await prisma.product.findMany({
        where: { organizationId },
        select: { id: true, name: true, stock: true }
      })

      controller.enqueue(JSON.stringify(products))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  })
}
```

---

## 📊 Advanced Shopify Analytics & Features

### 1. Shopify Sales Analytics Dashboard

**Features to Add:**

#### Revenue Tracking
- Daily/Weekly/Monthly revenue from Shopify
- Revenue by product category
- Revenue trends and forecasting
- Compare warehouse sales vs Shopify sales

#### Product Performance
- Best-selling Shopify products
- Worst-performing products (consider discontinuing)
- Stock velocity (how fast products sell)
- Profit margins per product

#### Sync Insights
- Last sync timestamp with status indicator
- Sync success rate (% of products synced successfully)
- Failed products log with retry option
- Sync frequency recommendations based on order volume

#### Inventory Intelligence
- Low stock alerts for Shopify products
- Overstock warnings (too much inventory)
- Stockout frequency (how often products run out)
- Reorder point recommendations (AI-based)

### 2. Advanced Shopify Features

#### Two-Way Sync (Future Enhancement)
```javascript
// Sync inventory changes back to Shopify
export async function syncStockToShopify(productId, newStock) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { organization: { include: { shopifyConnection: true } } }
  })

  if (product.syncedFromShopify && product.shopifyVariantId) {
    const shopify = await getShopifyClient(product.organization.shopifyConnection)

    await shopify.rest.InventoryLevel.set({
      inventory_item_id: product.shopifyVariantId,
      location_id: SHOPIFY_LOCATION_ID,
      available: newStock
    })
  }
}
```

#### Webhook Listeners (Real-Time Updates)
```javascript
// app/api/webhooks/shopify/products/update/route.js
import crypto from 'crypto'

export async function POST(request) {
  // Verify webhook authenticity
  const hmac = request.headers.get('X-Shopify-Hmac-Sha256')
  const body = await request.text()

  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(body)
    .digest('base64')

  if (hash !== hmac) {
    return new Response('Invalid signature', { status: 401 })
  }

  const payload = JSON.parse(body)

  // Update product in real-time
  await updateProductFromWebhook(payload)

  return new Response('OK', { status: 200 })
}
```

#### Order Sync
```javascript
// Sync Shopify orders into warehouse system
export async function syncShopifyOrders(organizationId) {
  const connection = await getShopifyConnection(organizationId)
  const shopify = await getShopifyClient(connection)

  const orders = await shopify.rest.Order.all({
    status: 'any',
    limit: 250
  })

  for (const order of orders) {
    await prisma.order.upsert({
      where: {
        orderId_organizationId: {
          orderId: `SHOPIFY-${order.id}`,
          organizationId
        }
      },
      create: {
        organizationId,
        orderId: `SHOPIFY-${order.id}`,
        customer: order.customer?.name || 'Shopify Customer',
        email: order.email,
        phone: order.phone,
        total: parseFloat(order.total_price),
        subtotal: parseFloat(order.subtotal_price),
        status: mapShopifyOrderStatus(order.fulfillment_status),
        // ... more fields
      },
      update: {
        status: mapShopifyOrderStatus(order.fulfillment_status),
        updatedAt: new Date()
      }
    })
  }
}
```

#### Multi-Location Support
```javascript
// Track products across multiple Shopify locations
model ShopifyLocation {
  id              String   @id @default(cuid())
  organizationId  String
  shopifyLocationId String
  name            String
  address         String?
  isActive        Boolean  @default(true)

  organization    Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, shopifyLocationId])
  @@index([organizationId])
}

model ProductLocationStock {
  id              String   @id @default(cuid())
  productId       Int
  locationId      String
  stock           Int

  product         Product  @relation(fields: [productId], references: [id])
  location        ShopifyLocation @relation(fields: [locationId], references: [id])

  @@unique([productId, locationId])
  @@index([productId])
  @@index([locationId])
}
```

### 3. New Report Types

#### Shopify Integration Health Report
- Sync success rate over time
- API rate limit usage
- Connection uptime/downtime
- Error logs and resolution status

#### Inventory Valuation Report
- Total inventory value (cost vs retail)
- Inventory aging (slow-moving stock)
- Dead stock identification
- Inventory turnover ratio

#### Sales Forecast Report (AI-Enhanced)
- Predict next month's sales based on historical data
- Seasonal trend analysis
- Recommended stock levels per product
- Revenue projections

#### Profitability Report
- Gross profit by product
- Gross profit by category
- Operating expenses tracking
- Net profit margins

---

## 🎨 UI/UX Improvements

### 1. Enhanced Dashboard

```javascript
// New dashboard widgets:

- Real-time sales ticker (live updates)
- Stock alerts with quick actions
- Top 5 products (Shopify + Warehouse)
- Revenue graph (7-day, 30-day, 90-day)
- Quick action buttons (New Order, Add Product, Run Sync)
- Notification center (low stock, failed syncs, new orders)
```

### 2. Advanced Search & Filters

```javascript
// Implement fuzzy search with filters
- Multi-field search (name, SKU, category, location)
- Save custom filter presets
- Export filtered results
- Bulk actions on search results
```

### 3. Mobile-Responsive Improvements

```javascript
// Optimize for mobile warehouse managers
- Touch-friendly buttons (larger tap targets)
- Swipe gestures for quick actions
- Mobile barcode scanner integration
- Offline mode for inventory counting
```

### 4. Data Visualization

```javascript
// Install chart libraries
npm install recharts d3

// New chart types:
- Heat maps for sales by time/day
- Sankey diagrams for order flow
- Gauge charts for KPIs
- Sparklines for quick trends
```

---

## 🛠️ Development Tools & DX Improvements

### 1. Code Organization

```
/lib
  /auth        - Authentication utilities
  /db          - Database utilities and middleware
  /shopify     - Shopify client and helpers
  /cache       - Caching layer
  /analytics   - Analytics computations
  /permissions - RBAC logic

/middleware
  /auth.js         - Authentication middleware
  /organization.js - Tenant context middleware
  /ratelimit.js    - Rate limiting

/hooks
  /useOrganization.js - Current org context
  /usePermissions.js  - Permission checking
  /useShopify.js      - Shopify data fetching
```

### 2. Environment Variables

```env
# Multi-tenancy
APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL=your-neon-connection-string

# Shopify (moved to database per organization)
# No longer needed in .env

# Optional: Redis for caching
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Optional: Email (for auth)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

# Optional: File storage (for images)
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### 3. TypeScript Migration (Recommended)

```bash
# Convert to TypeScript for better DX
npm install --save-dev typescript @types/react @types/node

# Rename files incrementally: .js → .ts, .jsx → .tsx
```

---

## 🚀 Deployment Strategy (Vercel + Neon)

### Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "env": {
    "DATABASE_URL": "@database-url"
  },
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 60
    }
  }
}
```

### Neon Database Setup

1. **Development**: Use Neon's free tier branch
2. **Staging**: Create a separate Neon branch
3. **Production**: Main Neon branch with autoscaling

```bash
# Migration workflow
npm run migrate        # Development
npx prisma migrate deploy  # Production (in Vercel build)
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx prisma generate
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📈 Scalability Roadmap

### Phase 1: Foundation (Current → Month 1)
- ✅ Implement multi-tenant schema
- ✅ Add authentication with NextAuth
- ✅ Create organization management
- ✅ Add database indexes
- ✅ Optimize queries

### Phase 2: Enhancement (Month 2-3)
- 🔄 Advanced Shopify analytics
- 🔄 Two-way inventory sync
- 🔄 Webhook integration
- 🔄 Report generation engine
- 🔄 Role-based permissions

### Phase 3: Scale (Month 4-6)
- 📊 Redis caching layer
- 📊 Advanced search (Algolia/ElasticSearch)
- 📊 Background job processing (BullMQ)
- 📊 File storage (S3/Cloudflare R2)
- 📊 Email notifications

### Phase 4: Enterprise (Month 6+)
- 🚀 Custom domain per organization
- 🚀 White-label branding
- 🚀 API access for customers
- 🚀 Advanced AI forecasting
- 🚀 Mobile app (React Native)

---

## 💰 Pricing Strategy Ideas

### Free Tier
- 1 organization
- 5 users
- 1,000 products
- 5,000 orders/month
- Basic Shopify sync
- Community support

### Starter ($29/month)
- 1 organization
- 10 users
- 10,000 products
- Unlimited orders
- Advanced analytics
- Email support

### Professional ($99/month)
- 3 organizations
- 50 users
- Unlimited products/orders
- Two-way Shopify sync
- Custom reports
- Priority support
- Webhooks

### Enterprise (Custom)
- Unlimited organizations
- Unlimited users
- White-label branding
- Custom domain
- SLA guarantee
- Dedicated support

---

## 🔒 Security Checklist

- [ ] Implement HTTPS everywhere
- [ ] Add CSRF protection
- [ ] Sanitize all inputs
- [ ] Use prepared statements (Prisma does this)
- [ ] Hash passwords with bcrypt (cost factor 12+)
- [ ] Implement rate limiting on API routes
- [ ] Add SQL injection protection (Prisma handles this)
- [ ] Secure environment variables
- [ ] Implement audit logging
- [ ] Add two-factor authentication (2FA)
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] GDPR compliance (data export, deletion)

---

## 📚 Next Steps

1. **Review this document** with your team
2. **Prioritize features** based on business needs
3. **Create Jira/Linear tickets** for each task
4. **Start with Phase 1** (multi-tenancy foundation)
5. **Set up staging environment** on Vercel
6. **Run database migration** on Neon development branch
7. **Implement authentication** using NextAuth
8. **Test thoroughly** before production deployment

---

## 📞 Questions to Consider

1. **Business Model**: Will you charge per organization or per user?
2. **Data Retention**: How long to keep historical data?
3. **Backup Strategy**: Automated backups with Neon?
4. **Support Channels**: Email, chat, or ticketing system?
5. **Onboarding Flow**: Self-service or assisted setup?
6. **Integrations**: Other platforms besides Shopify (WooCommerce, Amazon)?

---

**Document Version**: 1.0
**Created**: January 2025
**Last Updated**: January 9, 2025
**Status**: 📋 Ready for Review
