"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ShoppingBag,
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Search,
  ExternalLink,
  Loader2,
  TrendingUp,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

export default function ShopifyPage() {
  const [connection, setConnection] = useState(null)
  const [syncedProducts, setSyncedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState({
    totalShopify: 0,
    synced: 0,
    lastSync: null,
    status: 'disconnected'
  })

  useEffect(() => {
    loadConnectionAndProducts()
  }, [])

  const loadConnectionAndProducts = async () => {
    setLoading(true)
    try {
      // Load connection status
      const connRes = await fetch('/api/shopify/connection')
      if (connRes.ok) {
        const connData = await connRes.json()
        setConnection(connData.isConnected ? connData.connection : null)

        if (connData.isConnected) {
          setStats(prev => ({
            ...prev,
            status: 'connected',
            lastSync: connData.connection?.lastSyncAt
          }))
        }
      }

      // Load synced products
      const productsRes = await fetch('/api/products')
      if (productsRes.ok) {
        const products = await productsRes.json()
        const shopifyProducts = products.filter(p => p.syncedFromShopify)
        setSyncedProducts(shopifyProducts)
        setStats(prev => ({
          ...prev,
          synced: shopifyProducts.length,
          totalShopify: shopifyProducts.length
        }))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!connection) {
      alert('Please connect Shopify first in Settings → Integrations')
      return
    }

    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/shopify/sync-products', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setSyncResult({
          success: true,
          ...data.results
        })
        // Reload products
        await loadConnectionAndProducts()
      } else {
        setSyncResult({
          success: false,
          error: data.error
        })
      }
    } catch (error) {
      console.error('Error syncing products:', error)
      setSyncResult({
        success: false,
        error: error.message
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const filteredProducts = syncedProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "LOW_STOCK":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#95BF47]" />
          <p className="text-muted-foreground">Loading Shopify integration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#95BF47] rounded-xl flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Shopify Integration</h1>
                <p className="text-muted-foreground mt-1">
                  {connection
                    ? `Connected to ${connection.shopDomain}`
                    : 'Manage your Shopify inventory sync'}
                </p>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Connection Alert */}
        {!connection && (
          <Card className="mb-6 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                    Shopify Not Connected
                  </h3>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                    Connect your Shopify store to start syncing products.
                  </p>
                  <Link href="/settings?tab=Integrations">
                    <Button className="mt-3 bg-[#95BF47] hover:bg-[#7da239]">
                      Connect Shopify
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <ShoppingBag className="h-4 w-4 text-[#95BF47]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShopify}</div>
              <p className="text-xs text-muted-foreground">From Shopify</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Synced Items</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.synced}</div>
              <p className="text-xs text-muted-foreground">In warehouse</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Sync</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.lastSync
                  ? new Date(stats.lastSync).toLocaleDateString([], { month: 'short', day: 'numeric' })
                  : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.lastSync
                  ? new Date(stats.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'No sync yet'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
              {stats.status === 'connected' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.status === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.status === 'connected' ? 'Ready to sync' : 'Setup required'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sync Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sync Controls</CardTitle>
                <CardDescription>Sync products from your Shopify store</CardDescription>
              </div>
              <Button
                onClick={handleSync}
                disabled={!connection || syncing}
                className="bg-[#95BF47] hover:bg-[#7da239]"
              >
                {syncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Products Now
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {syncResult && (
            <CardContent>
              <div className={`rounded-lg p-4 ${
                syncResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-2">
                  {syncResult.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Sync Completed Successfully!
                        </p>
                        <div className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                          <p>• Total processed: {syncResult.total}</p>
                          <p>• Added: {syncResult.added}</p>
                          <p>• Updated: {syncResult.updated}</p>
                          {syncResult.errors > 0 && (
                            <p className="text-orange-700">• Errors: {syncResult.errors}</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-800 dark:text-red-200">
                          Sync Failed
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          {syncResult.error}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Synced Products Gallery */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Synced Products</CardTitle>
                <CardDescription>Products synced from Shopify ({filteredProducts.length})</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">No synced products yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {connection
                    ? 'Click "Sync Products Now" to import your Shopify inventory'
                    : 'Connect your Shopify store to get started'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {product.shopifyImageUrl || product.image ? (
                        <img
                          src={product.shopifyImageUrl || product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextElementSibling.style.display = 'flex'
                          }}
                        />
                      ) : (
                        <Package className="h-16 w-16 text-muted-foreground opacity-30" />
                      )}
                      <div className="hidden w-full h-full items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground opacity-30" />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground truncate mb-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2">SKU: {product.sku}</p>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-[#95BF47]">
                          ${product.value.toFixed(2)}
                        </span>
                        <Badge className={getStatusColor(product.status)}>
                          {product.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground mb-3">
                        Stock: <span className="font-medium text-foreground">{product.stock}</span>
                      </div>

                      {product.shopifyProductId && (
                        <a
                          href={`https://${connection?.shopDomain}/admin/products/${product.shopifyProductId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs text-[#95BF47] hover:underline"
                        >
                          View in Shopify
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
