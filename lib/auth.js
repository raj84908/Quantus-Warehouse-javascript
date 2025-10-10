import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

/**
 * Get the current authenticated user and their organization
 * Use this in API routes to get organization context
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    organizationId: session.user.organizationId,
    organizationName: session.user.organizationName,
    organizationSlug: session.user.organizationSlug,
    organizationPlan: session.user.organizationPlan
  }
}

/**
 * Require authentication - throws if not logged in
 * Returns the current user
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Get organization filter for database queries
 * This ensures data isolation - users only see their org's data
 *
 * Usage:
 * const products = await prisma.product.findMany({
 *   where: await orgFilter()
 * })
 */
export async function orgFilter() {
  const user = await requireAuth()
  return { organizationId: user.organizationId }
}

/**
 * Wrapper for API routes that require authentication
 * Automatically injects user into handler
 *
 * Usage:
 * export const GET = withAuth(async (request, { user }) => {
 *   // user is available here with organizationId
 *   const products = await prisma.product.findMany({
 *     where: { organizationId: user.organizationId }
 *   })
 *   return NextResponse.json({ products })
 * })
 */
export function withAuth(handler) {
  return async (request, context) => {
    try {
      const user = await requireAuth()
      return await handler(request, { ...context, user })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}
