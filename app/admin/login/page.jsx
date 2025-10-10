'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Store admin token
      localStorage.setItem('adminToken', data.token)
      router.push('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md border-slate-700">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Admin Login</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Super administrator access only
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Admin Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-center text-slate-500">
              Unauthorized access is prohibited and monitored
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
