export { default } from "next-auth/middleware"

// Protect these routes - require authentication
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inventory/:path*',
    '/orders/:path*',
    '/products/:path*',
    '/shopify/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/people/:path*',
    '/analytics/:path*',
  ]
}
