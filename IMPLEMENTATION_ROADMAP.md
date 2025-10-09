# 🚀 Implementation Roadmap - Quantus Warehouse SaaS

## 📋 Quick Reference

**Current Status**: Single-tenant warehouse system with Shopify integration
**Target**: Multi-tenant SaaS platform with advanced analytics

**Documents Created**:
1. `OPTIMIZATION_PLAN.md` - Complete architecture guide
2. `SHOPIFY_FEATURES_GUIDE.md` - Advanced Shopify features & analytics
3. `prisma/schema-multi-tenant.prisma` - Optimized database schema
4. `lib/auth-middleware-example.js` - Authentication & authorization
5. `lib/query-optimization-examples.js` - Database performance patterns

---

## ⚡ Phase 1: Foundation (Week 1-2) - CRITICAL

### Step 1.1: Backup & Preparation

```bash
# 1. Backup current database
npx prisma db pull --output=./backup-schema.prisma

# 2. Export data for safety
node scripts/export-all-data.js > backup-data.json

# 3. Create new Git branch
git checkout -b feature/multi-tenancy
```

### Step 1.2: Install Dependencies

```bash
npm install next-auth @auth/prisma-adapter bcrypt
npm install @tanstack/react-query
npm install --save-dev @types/bcrypt

# Optional (for advanced features)
npm install @upstash/redis  # For caching
npm install nodemailer      # For emails
```

### Step 1.3: Database Schema Migration

**IMPORTANT**: This is a breaking change. Follow carefully.

```bash
# 1. Replace current schema
cp prisma/schema-multi-tenant.prisma prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_multi_tenancy

# 3. Generate Prisma Client
npx prisma generate
```

### Step 1.4: Create Default Organization

```javascript
// scripts/create-default-org.js
import { prisma } from '../lib/prisma'
import bcrypt from 'bcrypt'

async function main() {
  // Create default organization
  const org = await prisma.organization.create({
    data: {
      name: "Your Company",
      slug: "your-company",
      plan: "FREE",
      subscriptionStatus: "active"
    }
  })

  console.log('Organization created:', org.id)

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const admin = await prisma.user.create({
    data: {
      email: "admin@yourcompany.com",
      password: hashedPassword,
      name: "Admin User",
      role: "OWNER",
      organizationId: org.id,
      emailVerified: true
    }
  })

  console.log('Admin user created:', admin.email)
  console.log('Password: admin123')
  console.log('\n⚠️  CHANGE THIS PASSWORD IMMEDIATELY!')

  return { org, admin }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
```

Run it:
```bash
node scripts/create-default-org.js
```

### Step 1.5: Migrate Existing Data

```javascript
// scripts/migrate-data.js
import { prisma } from '../lib/prisma'

async function migrateData(organizationId) {
  console.log('Migrating products...')
  await prisma.product.updateMany({
    where: { organizationId: null },
    data: { organizationId }
  })

  console.log('Migrating orders...')
  await prisma.order.updateMany({
    where: { organizationId: null },
    data: { organizationId }
  })

  console.log('Migrating categories...')
  await prisma.category.updateMany({
    where: { organizationId: null },
    data: { organizationId }
  })

  console.log('Migrating Shopify connection...')
  const shopifyConn = await prisma.shopifyConnection.findFirst()
  if (shopifyConn && !shopifyConn.organizationId) {
    await prisma.shopifyConnection.update({
      where: { id: shopifyConn.id },
      data: { organizationId }
    })
  }

  console.log('Migration complete!')
}

// Get organization ID from command line
const orgId = process.argv[2]
if (!orgId) {
  console.error('Usage: node scripts/migrate-data.js <organizationId>')
  process.exit(1)
}

migrateData(orgId)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
```

Run it:
```bash
node scripts/migrate-data.js <your-org-id-from-step-1.4>
```

---

## 🔐 Phase 2: Authentication (Week 2-3)

### Step 2.1: Setup NextAuth

Create `app/api/auth/[...nextauth]/route.js`:

```javascript
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true }
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
        token.organization = user.organization
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.organizationId = token.organizationId
        session.user.organization = token.organization
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

### Step 2.2: Create Auth Pages

Create `app/auth/signin/page.jsx`:

```jsx
'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    if (result?.error) {
      setError('Invalid email or password')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
```

### Step 2.3: Protect Routes with Middleware

Create `middleware.js` in root:

```javascript
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inventory/:path*',
    '/orders/:path*',
    '/products/:path*',
    '/shopify/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ]
}
```

### Step 2.4: Update API Routes

Update ALL API routes to use authentication:

```javascript
// Example: app/api/products/route.js
import { withAuth } from '@/lib/auth-middleware-example'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (request, { user }) => {
  const products = await prisma.product.findMany({
    where: { organizationId: user.organizationId },
    include: { category: true }
  })

  return NextResponse.json({ products })
})
```

---

## 📊 Phase 3: Advanced Analytics (Week 3-4)

### Step 3.1: Create Shopify Analytics Page

Copy the code from `SHOPIFY_FEATURES_GUIDE.md` section "Shopify Performance Dashboard"

File: `app/shopify/analytics/page.jsx`

### Step 3.2: Create Analytics API

Copy the code from `SHOPIFY_FEATURES_GUIDE.md` section "Backend API for Analytics"

File: `app/api/shopify/analytics/route.js`

### Step 3.3: Add Navigation Link

Update `components/sidebar.jsx` to add analytics link:

```jsx
{
  name: "Shopify Analytics",
  href: "/shopify/analytics",
  icon: TrendingUp
}
```

---

## ⚡ Phase 4: Performance Optimization (Week 4-5)

### Step 4.1: Implement React Query

Wrap app with QueryClientProvider:

```jsx
// app/providers.jsx
'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}
```

Update `app/layout.js`:

```jsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
```

### Step 4.2: Optimize Database Queries

Replace all API queries using patterns from `lib/query-optimization-examples.js`

Key changes:
- Add pagination to all list endpoints
- Use selective field selection
- Add proper indexes (already in schema-multi-tenant.prisma)
- Implement caching for frequently accessed data

---

## 🎨 Phase 5: UI Enhancements (Week 5-6)

### Step 5.1: Add Organization Switcher

```jsx
// components/organization-switcher.jsx
'use client'

import { useSession } from 'next-auth/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function OrganizationSwitcher() {
  const { data: session } = useSession()

  if (!session?.user?.organization) return null

  return (
    <div className="flex items-center space-x-2 p-4 border-b">
      <span className="text-sm text-gray-500">Organization:</span>
      <Select value={session.user.organizationId}>
        <SelectTrigger className="w-48">
          <SelectValue>{session.user.organization.name}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={session.user.organizationId}>
            {session.user.organization.name}
          </SelectItem>
          {/* Future: Add org switching for multi-org users */}
        </SelectContent>
      </Select>
    </div>
  )
}
```

### Step 5.2: Add User Profile Menu

```jsx
// components/user-menu.jsx
'use client'

import { signOut, useSession } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Settings, LogOut } from "lucide-react"

export function UserMenu() {
  const { data: session } = useSession()

  if (!session?.user) return null

  const initials = session.user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '??'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
          <Avatar>
            <AvatarImage src={session.user.avatar} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <div className="text-sm font-medium">{session.user.name}</div>
            <div className="text-xs text-gray-500">{session.user.role}</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 🧪 Phase 6: Testing & Deployment (Week 6-7)

### Step 6.1: Environment Variables

Update `.env`:

```env
# Database (Neon)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Optional: Redis (Upstash)
UPSTASH_REDIS_URL=""
UPSTASH_REDIS_TOKEN=""

# Optional: Email
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

### Step 6.2: Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET

# 4. Deploy
vercel --prod
```

### Step 6.3: Run Database Migration on Production

```bash
# Push schema to production database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

---

## 📈 Success Metrics

After implementation, you should have:

✅ Multi-tenant architecture with organization isolation
✅ Secure authentication with role-based access control
✅ Advanced Shopify analytics dashboard
✅ Optimized database queries (< 100ms average)
✅ Cached frequently accessed data
✅ Pagination on all list views
✅ Professional UI with user management
✅ Production-ready deployment on Vercel

---

## 🔧 Maintenance Tasks

### Weekly
- [ ] Review slow query logs
- [ ] Check error rates in monitoring
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies
- [ ] Review database performance
- [ ] Optimize slow queries
- [ ] Review security audit logs

### Quarterly
- [ ] Database backup verification
- [ ] Security audit
- [ ] Performance benchmarking
- [ ] Feature usage analysis

---

## 🆘 Troubleshooting

### Issue: Migration Fails

```bash
# Reset database (DEVELOPMENT ONLY!)
npx prisma migrate reset

# Then re-run migrations
npx prisma migrate dev
```

### Issue: Auth Not Working

Check:
1. `NEXTAUTH_SECRET` is set
2. `NEXTAUTH_URL` matches your domain
3. User exists in database
4. Password is hashed correctly

### Issue: Slow Queries

```javascript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

Then review slow queries and add indexes.

---

## 📚 Additional Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Neon Docs](https://neon.tech/docs)
- [Vercel Docs](https://vercel.com/docs)

### Example Code
- `OPTIMIZATION_PLAN.md` - Complete architecture
- `SHOPIFY_FEATURES_GUIDE.md` - Analytics implementation
- `lib/auth-middleware-example.js` - Auth patterns
- `lib/query-optimization-examples.js` - DB optimization

---

## ✅ Checklist

### Before Starting
- [ ] Backup current database
- [ ] Export all data to JSON
- [ ] Create new Git branch
- [ ] Review all documentation

### Phase 1 - Foundation
- [ ] Install dependencies
- [ ] Update database schema
- [ ] Run migrations
- [ ] Create default organization
- [ ] Migrate existing data
- [ ] Verify data integrity

### Phase 2 - Authentication
- [ ] Setup NextAuth
- [ ] Create auth pages
- [ ] Add middleware
- [ ] Update all API routes
- [ ] Test login/logout
- [ ] Test permissions

### Phase 3 - Analytics
- [ ] Create analytics page
- [ ] Create analytics API
- [ ] Test all charts
- [ ] Verify data accuracy

### Phase 4 - Performance
- [ ] Add React Query
- [ ] Optimize all queries
- [ ] Add caching
- [ ] Test performance

### Phase 5 - UI
- [ ] Add org switcher
- [ ] Add user menu
- [ ] Update sidebar
- [ ] Test responsiveness

### Phase 6 - Deployment
- [ ] Set environment variables
- [ ] Deploy to Vercel
- [ ] Run production migrations
- [ ] Test production app
- [ ] Monitor for errors

---

**Last Updated**: January 2025
**Estimated Time**: 6-7 weeks
**Status**: 📋 Ready for Implementation
