"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Building2 } from "lucide-react"

export function UserProfile() {
  const [session, setSession] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Try to get session from client-side
    import('next-auth/react').then(({ getSession }) => {
      getSession().then((sessionData) => {
        setSession(sessionData)
      }).catch(() => {
        // No session available
        setSession(null)
      })
    })
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  // Don't render on server or before mount
  if (!mounted) {
    return null
  }

  // Don't render if no session
  if (!session?.user) {
    return null
  }

  return (
    <div className="p-4 border-t space-y-3">
      {/* User Profile */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-medium">
              {session.user.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {session.user.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
        </div>

        {/* Organization Info */}
        <div className="flex items-start space-x-2 px-2 py-1.5 bg-muted/50 rounded-md">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {session.user.organizationName || 'Organization'}
            </p>
            <p className="text-xs text-muted-foreground">
              {session.user.organizationPlan || 'FREE'} Plan
            </p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="w-full justify-start"
        disabled={status === 'loading'}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {status === 'loading' ? 'Loading...' : 'Logout'}
      </Button>
    </div>
  )
}
