/**
 * Authentication & Authorization Middleware Examples
 *
 * This file contains example middleware for multi-tenant authentication
 * To implement: npm install next-auth @auth/prisma-adapter
 */

import { getServerSession } from 'next-auth'
import { prisma } from './prisma'

// ========================================
// AUTH CONFIGURATION (NextAuth.js)
// ========================================

// File: app/api/auth/[...nextauth]/route.js
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
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            lastLoginIp: credentials.ip
          }
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
    signOut: '/auth/signout',
    error: '/auth/error',
  }
}

// ========================================
// MIDDLEWARE FUNCTIONS
// ========================================

/**
 * Get current user session with organization
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          features: true
        }
      }
    }
  })

  return user
}

/**
 * Require authentication middleware
 * Usage: const user = await requireAuth()
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Require specific role
 * Usage: await requireRole(['ADMIN', 'OWNER'])
 */
export async function requireRole(allowedRoles) {
  const user = await requireAuth()

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }

  return user
}

/**
 * Check if user has permission
 */
export async function hasPermission(permission) {
  const user = await getCurrentUser()

  if (!user) return false

  // Check role-based permissions
  const rolePermissions = PERMISSIONS_MAP[permission] || []
  if (rolePermissions.includes(user.role)) {
    return true
  }

  // Check custom permissions
  return user.permissions.includes(permission)
}

/**
 * Require specific permission
 */
export async function requirePermission(permission) {
  const hasAccess = await hasPermission(permission)

  if (!hasAccess) {
    throw new Error(`Missing required permission: ${permission}`)
  }

  return await getCurrentUser()
}

// ========================================
// PERMISSION DEFINITIONS
// ========================================

export const PERMISSIONS_MAP = {
  // Products
  'products:view': ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'WAREHOUSE', 'SALES'],
  'products:create': ['OWNER', 'ADMIN', 'MANAGER', 'WAREHOUSE'],
  'products:edit': ['OWNER', 'ADMIN', 'MANAGER', 'WAREHOUSE'],
  'products:delete': ['OWNER', 'ADMIN', 'MANAGER'],
  'products:export': ['OWNER', 'ADMIN', 'MANAGER'],

  // Orders
  'orders:view': ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'SALES'],
  'orders:create': ['OWNER', 'ADMIN', 'MANAGER', 'SALES'],
  'orders:edit': ['OWNER', 'ADMIN', 'MANAGER', 'SALES'],
  'orders:delete': ['OWNER', 'ADMIN', 'MANAGER'],
  'orders:approve': ['OWNER', 'ADMIN', 'MANAGER'],

  // Inventory
  'inventory:view': ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'WAREHOUSE'],
  'inventory:adjust': ['OWNER', 'ADMIN', 'MANAGER', 'WAREHOUSE'],
  'inventory:transfer': ['OWNER', 'ADMIN', 'MANAGER', 'WAREHOUSE'],

  // Reports
  'reports:view': ['OWNER', 'ADMIN', 'MANAGER'],
  'reports:generate': ['OWNER', 'ADMIN', 'MANAGER'],
  'reports:export': ['OWNER', 'ADMIN', 'MANAGER'],

  // Settings
  'settings:view': ['OWNER', 'ADMIN'],
  'settings:edit': ['OWNER', 'ADMIN'],

  // Users
  'users:view': ['OWNER', 'ADMIN'],
  'users:create': ['OWNER', 'ADMIN'],
  'users:edit': ['OWNER', 'ADMIN'],
  'users:delete': ['OWNER'],

  // Billing
  'billing:view': ['OWNER'],
  'billing:manage': ['OWNER'],

  // Shopify
  'shopify:view': ['OWNER', 'ADMIN', 'MANAGER'],
  'shopify:sync': ['OWNER', 'ADMIN', 'MANAGER'],
  'shopify:configure': ['OWNER', 'ADMIN'],

  // Analytics
  'analytics:view': ['OWNER', 'ADMIN', 'MANAGER'],
  'analytics:export': ['OWNER', 'ADMIN', 'MANAGER']
}

// ========================================
// API ROUTE HELPERS
// ========================================

/**
 * Wrap API handler with authentication
 *
 * Usage:
 * export const GET = withAuth(async (request, { user }) => {
 *   // user is automatically injected
 *   return NextResponse.json({ data: 'protected' })
 * })
 */
export function withAuth(handler) {
  return async (request, context) => {
    try {
      const user = await requireAuth()

      // Add user and organization to context
      return await handler(request, { ...context, user })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

/**
 * Wrap API handler with role check
 *
 * Usage:
 * export const POST = withRole(['ADMIN', 'OWNER'], async (request, { user }) => {
 *   // Only admins and owners can access
 *   return NextResponse.json({ data: 'admin only' })
 * })
 */
export function withRole(allowedRoles, handler) {
  return withAuth(async (request, context) => {
    const { user } = context

    if (!allowedRoles.includes(user.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return await handler(request, context)
  })
}

/**
 * Wrap API handler with permission check
 *
 * Usage:
 * export const DELETE = withPermission('products:delete', async (request, { user }) => {
 *   // Only users with products:delete permission
 *   return NextResponse.json({ deleted: true })
 * })
 */
export function withPermission(permission, handler) {
  return withAuth(async (request, context) => {
    const { user } = context

    const rolePermissions = PERMISSIONS_MAP[permission] || []
    const hasAccess = rolePermissions.includes(user.role) ||
                     user.permissions.includes(permission)

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: `Missing permission: ${permission}` }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return await handler(request, context)
  })
}

// ========================================
// ORGANIZATION CONTEXT
// ========================================

/**
 * Get organization from request context
 */
export async function getOrganizationContext(request) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  return {
    organizationId: user.organizationId,
    organization: user.organization,
    user
  }
}

/**
 * Ensure query is scoped to user's organization
 *
 * Usage:
 * const products = await prisma.product.findMany({
 *   where: {
 *     ...await orgFilter(),
 *     status: 'IN_STOCK'
 *   }
 * })
 */
export async function orgFilter() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  return { organizationId: user.organizationId }
}

// ========================================
// USAGE EXAMPLES
// ========================================

/**
 * Example: Protected API route
 * File: app/api/products/route.js
 */
export const GET_EXAMPLE = withAuth(async (request, { user }) => {
  // Automatically filtered by organization
  const products = await prisma.product.findMany({
    where: { organizationId: user.organizationId }
  })

  return NextResponse.json({ products })
})

/**
 * Example: Admin-only route
 * File: app/api/admin/users/route.js
 */
export const POST_ADMIN_EXAMPLE = withRole(['ADMIN', 'OWNER'], async (request, { user }) => {
  const data = await request.json()

  const newUser = await prisma.user.create({
    data: {
      ...data,
      organizationId: user.organizationId
    }
  })

  return NextResponse.json({ user: newUser })
})

/**
 * Example: Permission-based route
 * File: app/api/products/[id]/route.js
 */
export const DELETE_EXAMPLE = withPermission('products:delete', async (request, { params, user }) => {
  // Ensure product belongs to user's organization
  const product = await prisma.product.findFirst({
    where: {
      id: parseInt(params.id),
      organizationId: user.organizationId
    }
  })

  if (!product) {
    return new Response('Product not found', { status: 404 })
  }

  await prisma.product.delete({
    where: { id: product.id }
  })

  return NextResponse.json({ deleted: true })
})

// ========================================
// CLIENT-SIDE HOOKS
// ========================================

/**
 * Client-side hook for checking permissions
 * File: hooks/usePermissions.js
 */
export function usePermissions() {
  const { data: session } = useSession()

  const hasPermission = (permission) => {
    if (!session?.user) return false

    const rolePermissions = PERMISSIONS_MAP[permission] || []
    return rolePermissions.includes(session.user.role) ||
           session.user.permissions?.includes(permission)
  }

  const hasRole = (roles) => {
    if (!session?.user) return false
    return roles.includes(session.user.role)
  }

  return {
    hasPermission,
    hasRole,
    user: session?.user,
    isAuthenticated: !!session?.user
  }
}

/**
 * Example usage in component:
 *
 * function ProductActions({ product }) {
 *   const { hasPermission } = usePermissions()
 *
 *   return (
 *     <div>
 *       {hasPermission('products:edit') && (
 *         <Button onClick={handleEdit}>Edit</Button>
 *       )}
 *       {hasPermission('products:delete') && (
 *         <Button onClick={handleDelete}>Delete</Button>
 *       )}
 *     </div>
 *   )
 * }
 */

// ========================================
// RATE LIMITING
// ========================================

/**
 * Simple in-memory rate limiter
 * For production, use Redis or Upstash
 */
const rateLimitMap = new Map()

export function rateLimit(identifier, limit = 100, windowMs = 60000) {
  const now = Date.now()
  const key = identifier

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { limited: false, remaining: limit - 1 }
  }

  const record = rateLimitMap.get(key)

  if (now > record.resetTime) {
    record.count = 1
    record.resetTime = now + windowMs
    return { limited: false, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { limited: true, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { limited: false, remaining: limit - record.count }
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(limit = 100, windowMs = 60000, handler) {
  return async (request, context) => {
    const identifier = request.headers.get('x-forwarded-for') || 'anonymous'

    const { limited, remaining, resetTime } = rateLimit(identifier, limit, windowMs)

    if (limited) {
      return new Response(
        JSON.stringify({
          error: 'Too many requests',
          resetAt: new Date(resetTime).toISOString()
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString()
          }
        }
      )
    }

    const response = await handler(request, context)

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())

    return response
  }
}
