"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Search,
  ExternalLink,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  Store,
  Filter,
  ChevronDown,
  Link2Off,
  Download
} from "lucide-react"
import Link from "next/link"

// Shopify Logo SVG Component
const ShopifyLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 256 292" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M223.774 57.34c-.201-1.46-1.48-2.268-2.537-2.357-1.055-.088-23.383-1.743-23.383-1.743s-15.507-15.395-17.209-17.099c-1.703-1.703-5.029-1.185-6.32-.805-.19.056-3.388 1.043-8.678 2.68-5.18-14.906-14.322-28.604-30.405-28.604-.444 0-.901.018-1.358.044C129.31 3.407 123.644.779 118.75.779c-37.465 0-55.364 46.835-61.001 70.632-14.558 4.511-24.9 7.718-26.221 8.133-8.126 2.549-8.383 2.805-9.45 10.462C21.3 95.806.038 260.235.038 260.235l165.678 31.042 89.77-19.42S223.973 58.8 223.775 57.34zM156.49 40.848l-14.019 4.339c.005-.988.01-1.96.01-3.023 0-9.264-1.286-16.723-3.349-22.636 8.287 1.04 13.806 10.469 17.358 21.32zm-27.638-19.483c2.304 5.773 3.802 14.058 3.802 25.238 0 .572-.005 1.095-.01 1.624-9.117 2.824-19.024 5.89-28.953 8.966 5.575-21.516 16.025-31.908 25.161-35.828zm-11.131-10.537c1.617 0 3.246.549 4.805 1.622-12.007 5.65-24.877 19.88-30.312 48.297l-22.886 7.088C75.694 46.16 90.81 10.828 117.72 10.828z"
      fill="#95BF47"
    />
    <path
      d="M221.237 54.983c-1.055-.088-23.383-1.743-23.383-1.743s-15.507-15.395-17.209-17.099c-.637-.634-1.496-.959-2.394-1.099l-12.527 256.233 89.762-19.418S223.972 58.8 223.774 57.34c-.201-1.46-1.48-2.268-2.537-2.357"
      fill="#5E8E3E"
    />
    <path
      d="M135.242 104.585l-11.069 32.926s-9.698-5.176-21.586-5.176c-17.428 0-18.305 10.937-18.305 13.693 0 15.038 39.2 20.8 39.2 56.024 0 27.713-17.577 45.558-41.277 45.558-28.44 0-42.984-17.7-42.984-17.7l7.615-25.16s14.95 12.835 27.565 12.835c8.243 0 11.596-6.49 11.596-11.232 0-19.616-32.16-20.491-32.16-52.724 0-27.129 19.472-53.382 58.778-53.382 15.145 0 22.627 4.338 22.627 4.338"
      fill="#FFF"
    />
  </svg>
)

export default function ShopifyPage() {
  const [stores, setStores] = useState([])
  const [activeStore, setActiveStore] = useState(null)
  const [syncedProducts, setSyncedProducts] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showSelectiveSync, setShowSelectiveSync] = useState(false)
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [activeTab, setActiveTab] = useState('synced') // 'synced' or 'available'
  const [stats, setStats] = useState({
    totalShopify: 0,
    synced: 0,
    lastSync: null,
    status: 'disconnected'
  })

  useEffect(() => {
    loadStoresAndProducts()
  }, [])

  useEffect(() => {
    if (activeStore) {
      loadConnectionData()
    }
  }, [activeStore])

  const loadStoresAndProducts = async () => {
    setLoading(true)
    try {
      // Load all connected stores
      const storesRes = await fetch('/api/shopify/stores')
      if (storesRes.ok) {
        const storesData = await storesRes.json()
        setStores(storesData.stores || [])
        if (storesData.stores && storesData.stores.length > 0) {
          setActiveStore(storesData.stores[0])
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

  const loadConnectionData = async () => {
    if (!activeStore) return

    try {
      const connRes = await fetch(`/api/shopify/connection?storeId=${activeStore.id}`)
      if (connRes.ok) {
        const connData = await connRes.json()
        setStats(prev => ({
          ...prev,
          status: connData.isConnected ? 'connected' : 'disconnected',
          lastSync: connData.connection?.lastSyncAt
        }))
      }
    } catch (error) {
      console.error('Error loading connection:', error)
    }
  }

  const loadAvailableProducts = async () => {
    if (!activeStore) return

    setLoadingAvailable(true)
    try {
      const res = await fetch(`/api/shopify/products?storeId=${activeStore.id}`)
      if (res.ok) {
        const data = await res.json()
        setAvailableProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error loading available products:', error)
    } finally {
      setLoadingAvailable(false)
    }
  }

  const handleSync = async (selective = false) => {
    if (!activeStore) {
      alert('Please connect a Shopify store first')
      return
    }

    if (selective && selectedProducts.length === 0) {
      alert('Please select products to sync')
      return
    }

    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/shopify/sync-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: activeStore.id,
          selective,
          productIds: selective ? selectedProducts : undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        setSyncResult({
          success: true,
          ...data.results
        })
        setSelectedProducts([])
        await loadStoresAndProducts()
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

  const handleBulkUnsync = async () => {
    if (!confirm('Are you sure you want to unsync ALL products from Shopify? This will remove the Shopify link but keep the products in your warehouse.')) {
      return
    }

    try {
      const response = await fetch('/api/shopify/unsync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: activeStore?.id })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Successfully unsynced ${data.count} products`)
        await loadStoresAndProducts()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error unsyncing products:', error)
      alert('Failed to unsync products')
    }
  }

  const handleRemoveStore = async (storeId) => {
    if (!confirm('Are you sure you want to remove this store connection? This will unsync all products from this store.')) {
      return
    }

    try {
      const response = await fetch(`/api/shopify/stores/${storeId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert('Store removed successfully')
        await loadStoresAndProducts()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error removing store:', error)
      alert('Failed to remove store')
    }
  }

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredAvailableProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredAvailableProducts.map(p => p.id))
    }
  }

  const filteredProducts = syncedProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAvailableProducts = availableProducts.filter(p =>
    !syncedProducts.some(sp => sp.shopifyProductId === p.id) &&
    (p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.variants?.[0]?.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900"
      case "LOW_STOCK":
        return "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-900"
      case "OUT_OF_STOCK":
        return "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#95BF47]" />
          <p className="text-gray-600 dark:text-gray-400">Loading Shopify integration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header with Shopify Logo */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <ShopifyLogo className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopify Integration</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {stores.length > 0
                    ? `Managing ${stores.length} store${stores.length > 1 ? 's' : ''}`
                    : 'Connect your Shopify stores to sync inventory'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/settings?tab=Integrations">
                <Button variant="outline" className="border-gray-200 dark:border-gray-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Store
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="border-gray-200 dark:border-gray-700">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Store Selector & Connection Alert */}
        {stores.length === 0 ? (
          <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-[#95BF47]/10 to-[#5E8E3E]/10 dark:from-[#95BF47]/5 dark:to-[#5E8E3E]/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <ShopifyLogo className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                    No Shopify Stores Connected
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Connect your first Shopify store to start syncing products and managing your inventory seamlessly.
                  </p>
                  <Link href="/settings?tab=Integrations">
                    <Button className="mt-4 bg-[#95BF47] hover:bg-[#7da239] text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Connect Your First Store
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-0 shadow-sm dark:bg-gray-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Store className="h-5 w-5 text-[#95BF47]" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      Active Store
                    </label>
                    <Select
                      value={activeStore?.id}
                      onValueChange={(value) => {
                        const store = stores.find(s => s.id === value)
                        setActiveStore(store)
                      }}
                    >
                      <SelectTrigger className="w-full max-w-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        {stores.map(store => (
                          <SelectItem key={store.id} value={store.id} className="text-gray-900 dark:text-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{store.shopDomain}</span>
                              {store.isActive && (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {activeStore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveStore(activeStore.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Store
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm dark:bg-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-[#95BF47]/10">
                  <Store className="h-5 w-5 text-[#95BF47]" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{stores.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Connected Stores</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{stats.synced}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Synced Products</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {stats.lastSync
                  ? new Date(stats.lastSync).toLocaleDateString([], { month: 'short', day: 'numeric' })
                  : 'Never'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Sync</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-gray-800/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stats.status === 'connected' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  {stats.status === 'connected' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {stats.status === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stats.status === 'connected' ? 'Ready to sync' : 'Setup required'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sync Controls */}
        <Card className="mb-6 border-0 shadow-sm dark:bg-gray-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white">Sync Controls</CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                  Manage product synchronization with Shopify
                </CardDescription>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBulkUnsync}
                  disabled={syncedProducts.length === 0}
                  className="border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Link2Off className="mr-2 h-4 w-4" />
                  Unsync All
                </Button>
                <Button
                  onClick={() => {
                    setShowSelectiveSync(!showSelectiveSync)
                    if (!showSelectiveSync && availableProducts.length === 0) {
                      loadAvailableProducts()
                    }
                  }}
                  disabled={!activeStore}
                  variant="outline"
                  className="border-gray-200 dark:border-gray-700"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Selective Sync
                </Button>
                <Button
                  onClick={() => handleSync(false)}
                  disabled={!activeStore || syncing}
                  className="bg-[#95BF47] hover:bg-[#7da239] text-white"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync All Products
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          {syncResult && (
            <CardContent className="pt-0">
              <div className={`rounded-lg p-4 border ${
                syncResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
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

        {/* Selective Sync Panel */}
        {showSelectiveSync && (
          <Card className="mb-6 border-0 shadow-sm dark:bg-gray-800/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">Select Products to Sync</CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Choose specific products from your Shopify store ({selectedProducts.length} selected)
                  </CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="border-gray-200 dark:border-gray-700"
                  >
                    {selectedProducts.length === filteredAvailableProducts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSync(true)}
                    disabled={selectedProducts.length === 0 || syncing}
                    className="bg-[#95BF47] hover:bg-[#7da239] text-white"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Sync Selected ({selectedProducts.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingAvailable ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#95BF47]" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading available products...</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredAvailableProducts.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No new products available to sync
                    </p>
                  ) : (
                    filteredAvailableProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => handleSelectProduct(product.id)}
                      >
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                        />
                        {product.image?.src && (
                          <img
                            src={product.image.src}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{product.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            SKU: {product.variants?.[0]?.sku || 'N/A'} • ${product.variants?.[0]?.price || '0.00'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Products Display */}
        <Card className="border-0 shadow-sm dark:bg-gray-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#95BF47]" />
                  Synced Products
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredProducts.length} products synced from Shopify
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No synced products yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  {activeStore
                    ? 'Click "Sync All Products" to import your Shopify inventory'
                    : 'Connect a Shopify store to get started'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
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
                        <Package className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                      )}
                      <div className="hidden w-full h-full items-center justify-center">
                        <Package className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1 text-sm">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">SKU: {product.sku}</p>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-[#95BF47]">
                          ${parseFloat(product.value || 0).toFixed(2)}
                        </span>
                        <Badge className={getStatusColor(product.status)}>
                          {product.status?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Stock: <span className="font-medium text-gray-900 dark:text-white">{product.stock}</span>
                      </div>

                      {product.shopifyProductId && activeStore && (
                        <a
                          href={`https://${activeStore.shopDomain}/admin/products/${product.shopifyProductId}`}
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
