'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Users, Key, Trash2, Pause, Play, Eye, LogOut, Mail, KeyRound } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function AdminDashboard() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState([])
  const [accessKeys, setAccessKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showKeysDialog, setShowKeysDialog] = useState(false)
  const [showUsersDialog, setShowUsersDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken')

      const [orgsRes, keysRes] = await Promise.all([
        fetch('/api/admin/organizations', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/access-keys', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json()
        setOrganizations(orgsData.organizations)
      }

      if (keysRes.ok) {
        const keysData = await keysRes.json()
        setAccessKeys(keysData.keys)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    router.push('/admin/login')
  }

  const handleDeleteOrg = async () => {
    if (!selectedOrg) return

    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/organizations/${selectedOrg.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setOrganizations(orgs => orgs.filter(o => o.id !== selectedOrg.id))
        setShowDeleteDialog(false)
        setSelectedOrg(null)
      }
    } catch (error) {
      console.error('Error deleting organization:', error)
    }
  }

  const handleToggleSuspend = async (org) => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/organizations/${org.id}/toggle-suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling suspension:', error)
    }
  }

  const handleCreateKey = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/access-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxUses: null,
          expiresAt: null,
          notes: 'Generated from admin panel'
        })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error creating key:', error)
    }
  }

  const handleResetPassword = async () => {
    setPasswordError('')
    setPasswordSuccess('')

    // Validation
    if (!newPassword || !confirmPassword) {
      setPasswordError('Please enter both password fields')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    if (!/[a-z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one lowercase letter')
      return
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter')
      return
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one number')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        setPasswordSuccess(`Password updated successfully for ${selectedUser.email}`)
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          setShowPasswordDialog(false)
          setPasswordSuccess('')
          setSelectedUser(null)
        }, 2000)
      } else {
        setPasswordError(data.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      setPasswordError('Failed to reset password')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">Quantus Warehouse Management</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accessKeys.filter(k => k.isActive).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <Pause className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {organizations.filter(o => o.isSuspended).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Manage all customer organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizations.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No organizations yet</p>
              ) : (
                organizations.map(org => (
                  <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{org.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-500">{org.slug}</span>
                        <span className="text-sm text-slate-500">
                          {org._count?.users || 0} users
                        </span>
                        <span className="text-sm text-slate-500">
                          {org._count?.products || 0} products
                        </span>
                        {org.isSuspended && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrg(org)
                          setShowUsersDialog(true)
                        }}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        View Users
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleSuspend(org)}
                      >
                        {org.isSuspended ? (
                          <><Play className="h-4 w-4 mr-2" /> Activate</>
                        ) : (
                          <><Pause className="h-4 w-4 mr-2" /> Suspend</>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedOrg(org)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Access Keys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Access Keys</CardTitle>
                <CardDescription>Manage signup access keys</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateKey}>Create New Key</Button>
                <Button variant="outline" onClick={() => setShowKeysDialog(true)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accessKeys.slice(0, 5).map(key => (
                <div key={key.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <code className="text-sm font-mono">{key.key}</code>
                    <div className="text-xs text-slate-500 mt-1">
                      Used: {key.currentUses} {key.maxUses ? `/ ${key.maxUses}` : '(unlimited)'}
                    </div>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {key.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedOrg?.name}"? This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All users in this organization</li>
                <li>All products ({selectedOrg?._count?.products || 0})</li>
                <li>All orders ({selectedOrg?._count?.orders || 0})</li>
                <li>All other data</li>
              </ul>
              <p className="mt-2 font-semibold text-red-600">This action cannot be undone!</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrg}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keys Dialog */}
      <Dialog open={showKeysDialog} onOpenChange={setShowKeysDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>All Access Keys</DialogTitle>
            <DialogDescription>
              Copy and share these keys with customers to allow signup
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {accessKeys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <code className="text-sm font-mono">{key.key}</code>
                  <div className="text-xs text-slate-500 mt-1">
                    Used: {key.currentUses} {key.maxUses ? `/ ${key.maxUses}` : '(unlimited)'}
                    {key.expiresAt && ` • Expires: ${new Date(key.expiresAt).toLocaleDateString()}`}
                  </div>
                  {key.notes && (
                    <div className="text-xs text-slate-400 mt-1">{key.notes}</div>
                  )}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {key.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Users Dialog */}
      <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Users in {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              All user accounts and their login credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedOrg?.users && selectedOrg.users.length > 0 ? (
              selectedOrg.users.map(user => (
                <div key={user.id} className="p-4 border rounded-lg bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{user.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {user.role}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-mono text-slate-700">{user.email}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        {user.lastLoginAt && (
                          <div className="text-xs text-slate-500">
                            Last Login: {new Date(user.lastLoginAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowPasswordDialog(true)
                        setNewPassword('')
                        setConfirmPassword('')
                        setPasswordError('')
                        setPasswordSuccess('')
                      }}
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Reset Password
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">No users in this organization</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                {passwordSuccess}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!!passwordSuccess}
              />
              <p className="text-xs text-slate-500">
                Minimum 8 characters, with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!!passwordSuccess}
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Copy the new password and send it securely to the user. They should change it after their first login.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false)
                setNewPassword('')
                setConfirmPassword('')
                setPasswordError('')
                setPasswordSuccess('')
                setSelectedUser(null)
              }}
            >
              {passwordSuccess ? 'Close' : 'Cancel'}
            </Button>
            {!passwordSuccess && (
              <Button onClick={handleResetPassword}>
                Reset Password
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
