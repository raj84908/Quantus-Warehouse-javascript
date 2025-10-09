"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Sun, Moon, Monitor, SettingsIcon, Palette, FileText, Upload, Image, ShoppingBag, CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("General")
  const [compactMode, setCompactMode] = useState(false)

  // system preferences
  const [warehouseName, setWarehouseName] = useState("Quantus Main Warehouse")
  const [timezone, setTimezone] = useState("est")
  const [currency, setCurrency] = useState("usd")

  // appearance
  const [language, setLanguage] = useState("en")

  // invoice settings
// In the invoice settings state, add invoiceComments
// Update the invoice settings state
  const [invoiceSettings, setInvoiceSettings] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    logo: null,
    primaryColor: "#8B5A3C",
    secondaryColor: "#F5F5F5",
    textColor: "#FFFFFF",
    invoiceComments: "Thank you for your business! Please remit payment within 30 days of invoice date. Late payments may be subject to fees.",
    paymentMethods: "Bank Transfer: [Account Details]\nPayPal: payment@company.com\nCheck: Make payable to Company Name"
  })
  const [logoPreview, setLogoPreview] = useState(null)
  const [isLoadingInvoiceSettings, setIsLoadingInvoiceSettings] = useState(false)

  // Shopify integration state
  const [shopifyConnection, setShopifyConnection] = useState(null)
  const [shopifyCredentials, setShopifyCredentials] = useState({
    shopDomain: "",
    accessToken: "",
    apiKey: "",
    apiSecret: ""
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSavingShopify, setIsSavingShopify] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState(null)

  // Load invoice settings and Shopify connection on component mount
  useEffect(() => {
    loadInvoiceSettings()
    loadShopifyConnection()
  }, [])

  const loadInvoiceSettings = async () => {
    try {
      setIsLoadingInvoiceSettings(true)
      const response = await fetch('/api/invoice-settings')
      if (response.ok) {
        const settings = await response.json()
        setInvoiceSettings(settings)
        setLogoPreview(settings.logo)
      }
    } catch (error) {
      console.error('Error loading invoice settings:', error)
    } finally {
      setIsLoadingInvoiceSettings(false)
    }
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const logoData = e.target.result
        setInvoiceSettings(prev => ({ ...prev, logo: logoData }))
        setLogoPreview(logoData)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInvoiceSettingChange = (field, value) => {
    setInvoiceSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveInvoiceSettings = async () => {
    try {
      setIsLoadingInvoiceSettings(true)
      const response = await fetch('/api/invoice-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceSettings)
      })
      
      if (response.ok) {
        alert('Invoice settings saved successfully! ✅')
        // Notify other parts of the app that invoice settings were updated
        window.postMessage('invoice-settings-updated', '*')
        console.log('Broadcasting invoice settings update notification')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving invoice settings:', error)
      alert('Failed to save invoice settings. Please try again.')
    } finally {
      setIsLoadingInvoiceSettings(false)
    }
  }

  const handleSaveSystem = () => {
    console.log("Saved system settings:", { warehouseName, timezone, currency })
    alert("System settings saved ✅")
  }

  const handleSaveAppearance = () => {
    console.log("Saved appearance settings:", { theme, language, compactMode })
    alert("Appearance settings saved ✅")
  }

  // Load Shopify connection
  const loadShopifyConnection = async () => {
    try {
      const response = await fetch('/api/shopify/connection')
      if (response.ok) {
        const data = await response.json()
        if (data.isConnected && data.connection) {
          setShopifyConnection(data.connection)
          setShopifyCredentials({
            shopDomain: data.connection.shopDomain || "",
            accessToken: data.connection.accessToken || "",
            apiKey: data.connection.apiKey || "",
            apiSecret: data.connection.apiSecret || ""
          })
        }
      }
    } catch (error) {
      console.error('Error loading Shopify connection:', error)
    }
  }

  // Test Shopify connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionTestResult(null)

    try {
      const response = await fetch('/api/shopify/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopDomain: shopifyCredentials.shopDomain,
          accessToken: shopifyCredentials.accessToken
        })
      })

      const data = await response.json()
      setConnectionTestResult(data)
    } catch (error) {
      console.error('Error testing connection:', error)
      setConnectionTestResult({
        success: false,
        error: error.message
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Save Shopify connection
  const handleSaveShopifyConnection = async () => {
    setIsSavingShopify(true)

    try {
      const response = await fetch('/api/shopify/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopifyCredentials)
      })

      if (response.ok) {
        alert('Shopify connected successfully! ✅')
        await loadShopifyConnection()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save connection')
      }
    } catch (error) {
      console.error('Error saving Shopify connection:', error)
      alert(`Failed to save connection: ${error.message}`)
    } finally {
      setIsSavingShopify(false)
    }
  }

  // Disconnect Shopify
  const handleDisconnectShopify = async () => {
    if (!confirm('Are you sure you want to disconnect Shopify? This will not delete synced products.')) {
      return
    }

    try {
      const response = await fetch('/api/shopify/connection', {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Shopify disconnected successfully')
        setShopifyConnection(null)
        setShopifyCredentials({
          shopDomain: "",
          accessToken: "",
          apiKey: "",
          apiSecret: ""
        })
        setConnectionTestResult(null)
      }
    } catch (error) {
      console.error('Error disconnecting Shopify:', error)
      alert('Failed to disconnect Shopify')
    }
  }

  const settingsTabs = [
    "General",
    "Invoice",
    "Account",
    "Notifications",
    "Security",
    "Integrations",
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your warehouse system preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 border-b">
            {settingsTabs.map((tab) => (
              <Button
                key={tab}
                variant="ghost"
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground"
                }
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        {/* Only show content for active tab */}
        {activeTab === "General" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  System Preferences
                </CardTitle>
                <CardDescription>
                  Configure general system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="warehouseName">Warehouse Name</Label>
                  <Input
                    id="warehouseName"
                    value={warehouseName}
                    onChange={(e) => setWarehouseName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="est">Eastern Standard Time</SelectItem>
                      <SelectItem value="cst">Central Standard Time</SelectItem>
                      <SelectItem value="mst">Mountain Standard Time</SelectItem>
                      <SelectItem value="pst">Pacific Standard Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="cad">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleSaveSystem}>
                  Save System Settings
                </Button>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className="flex flex-col items-center p-4 h-auto"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-4 w-4 mb-2" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className="flex flex-col items-center p-4 h-auto"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-4 w-4 mb-2" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className="flex flex-col items-center p-4 h-auto"
                      onClick={() => setTheme("system")}
                    >
                      <Monitor className="h-4 w-4 mb-2" />
                      System
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use smaller spacing and fonts
                    </p>
                  </div>
                  <Switch
                    id="compact"
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>

                <Button className="w-full" onClick={handleSaveAppearance}>
                  Save Appearance Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invoice Settings Tab */}
        {activeTab === "Invoice" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
                <CardDescription>
                  Configure your company details for invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    placeholder="Your Company Name"
                    value={invoiceSettings.companyName}
                    onChange={(e) => handleInvoiceSettingChange('companyName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    placeholder="company@example.com"
                    value={invoiceSettings.companyEmail || ''}
                    onChange={(e) => handleInvoiceSettingChange('companyEmail', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Company Phone</Label>
                  <Input
                    id="companyPhone"
                    placeholder="(555) 123-4567"
                    value={invoiceSettings.companyPhone || ''}
                    onChange={(e) => handleInvoiceSettingChange('companyPhone', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    placeholder="123 Main St&#10;City, State 12345"
                    rows={3}
                    value={invoiceSettings.companyAddress || ''}
                    onChange={(e) => handleInvoiceSettingChange('companyAddress', e.target.value)}
                  />
                </div>

                {/* NEW: Invoice Comments Field */}
                <div className="space-y-2">
                  <Label htmlFor="invoiceComments">Invoice Footer Comments</Label>
                  <Textarea
                      id="invoiceComments"
                      placeholder="Thank you for your business! Please remit payment within 30 days..."
                      rows={4}
                      value={invoiceSettings.invoiceComments || ''}
                      onChange={(e) => handleInvoiceSettingChange('invoiceComments', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This text will appear in the comments section at the bottom of your invoices
                  </p>
                </div>

                {/* NEW: Payment Methods Field */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethods">Payment Methods</Label>
                  <Textarea
                      id="paymentMethods"
                      placeholder="Bank Transfer: [Account Details]&#10;PayPal: payment@company.com&#10;Check: Make payable to Company Name"
                      rows={5}
                      value={invoiceSettings.paymentMethods || ''}
                      onChange={(e) => handleInvoiceSettingChange('paymentMethods', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your payment methods (one per line). This will appear in the payment section of your invoices.
                  </p>
                </div>
                
              </CardContent>
            </Card>
            
            

            {/* Logo and Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  Logo & Branding
                </CardTitle>
                <CardDescription>
                  Upload your logo and customize colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <Label>Company Logo</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    {logoPreview ? (
                      <div className="space-y-3">
                        <img 
                          src={logoPreview} 
                          alt="Company Logo" 
                          className="mx-auto max-h-20 max-w-32 object-contain"
                        />
                        <Button variant="outline" onClick={() => document.getElementById('logoUpload').click()}>
                          <Upload className="h-4 w-4 mr-2" />
                          Change Logo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <div>
                          <Button variant="outline" onClick={() => document.getElementById('logoUpload').click()}>
                            Upload Logo
                          </Button>
                          <p className="text-sm text-muted-foreground mt-2">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      id="logoUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>

                {/* Color Scheme */}
                <div className="space-y-4">
                  <Label>Color Scheme</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor" className="text-sm">Header Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          id="primaryColor"
                          type="color"
                          value={invoiceSettings.primaryColor}
                          onChange={(e) => handleInvoiceSettingChange('primaryColor', e.target.value)}
                          className="w-12 h-10 border border-input rounded-md cursor-pointer"
                        />
                        <Input
                          value={invoiceSettings.primaryColor}
                          onChange={(e) => handleInvoiceSettingChange('primaryColor', e.target.value)}
                          className="flex-1"
                          placeholder="#8B5A3C"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor" className="text-sm">Background Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          id="secondaryColor"
                          type="color"
                          value={invoiceSettings.secondaryColor}
                          onChange={(e) => handleInvoiceSettingChange('secondaryColor', e.target.value)}
                          className="w-12 h-10 border border-input rounded-md cursor-pointer"
                        />
                        <Input
                          value={invoiceSettings.secondaryColor}
                          onChange={(e) => handleInvoiceSettingChange('secondaryColor', e.target.value)}
                          className="flex-1"
                          placeholder="#F5F5F5"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="textColor" className="text-sm">Header Text Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          id="textColor"
                          type="color"
                          value={invoiceSettings.textColor}
                          onChange={(e) => handleInvoiceSettingChange('textColor', e.target.value)}
                          className="w-12 h-10 border border-input rounded-md cursor-pointer"
                        />
                        <Input
                          value={invoiceSettings.textColor}
                          onChange={(e) => handleInvoiceSettingChange('textColor', e.target.value)}
                          className="flex-1"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: invoiceSettings.secondaryColor }}>
                    <div 
                      className="p-3 rounded-md mb-3" 
                      style={{ 
                        backgroundColor: invoiceSettings.primaryColor,
                        color: invoiceSettings.textColor 
                      }}
                    >
                      <div className="font-bold text-lg">INVOICE</div>
                      <div className="text-sm opacity-90">{invoiceSettings.companyName || 'Your Company'}</div>
                    </div>
                    <div className="text-sm text-gray-600">Preview of invoice header</div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSaveInvoiceSettings}
                  disabled={isLoadingInvoiceSettings}
                >
                  {isLoadingInvoiceSettings ? 'Saving...' : 'Save Invoice Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "Integrations" && (
          <div className="grid grid-cols-1 gap-6">
            {/* Shopify Integration Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#95BF47] rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Shopify Integration
                        {shopifyConnection?.isConnected && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {shopifyConnection?.isConnected
                          ? `Connected to ${shopifyConnection.shopDomain}`
                          : 'Connect your Shopify store to sync inventory'}
                      </CardDescription>
                    </div>
                  </div>
                  {shopifyConnection?.isConnected && (
                    <Button variant="destructive" onClick={handleDisconnectShopify}>
                      Disconnect
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Connection Status */}
                {shopifyConnection?.lastSyncAt && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Connected</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Last synced: {new Date(shopifyConnection.lastSyncAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Shop Domain */}
                <div className="space-y-2">
                  <Label htmlFor="shopDomain">Shop Domain *</Label>
                  <Input
                    id="shopDomain"
                    placeholder="your-store.myshopify.com"
                    value={shopifyCredentials.shopDomain}
                    onChange={(e) => setShopifyCredentials(prev => ({
                      ...prev,
                      shopDomain: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Shopify store domain (e.g., my-store.myshopify.com)
                  </p>
                </div>

                {/* Access Token */}
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Admin API Access Token *</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
                    value={shopifyCredentials.accessToken}
                    onChange={(e) => setShopifyCredentials(prev => ({
                      ...prev,
                      accessToken: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a custom app in your Shopify admin to get this token
                  </p>
                </div>

                {/* API Key (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key (Optional)</Label>
                  <Input
                    id="apiKey"
                    placeholder="Enter API key"
                    value={shopifyCredentials.apiKey}
                    onChange={(e) => setShopifyCredentials(prev => ({
                      ...prev,
                      apiKey: e.target.value
                    }))}
                  />
                </div>

                {/* API Secret (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret (Optional)</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    placeholder="Enter API secret"
                    value={shopifyCredentials.apiSecret}
                    onChange={(e) => setShopifyCredentials(prev => ({
                      ...prev,
                      apiSecret: e.target.value
                    }))}
                  />
                </div>

                {/* Connection Test Result */}
                {connectionTestResult && (
                  <div className={`rounded-lg p-4 ${
                    connectionTestResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-start gap-2">
                      {connectionTestResult.success ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-green-800 dark:text-green-200">
                              Connection Successful!
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                              Shop: {connectionTestResult.shopName}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-red-800 dark:text-red-200">
                              Connection Failed
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              {connectionTestResult.error}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={!shopifyCredentials.shopDomain || !shopifyCredentials.accessToken || isTestingConnection}
                  >
                    {isTestingConnection ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Connection'
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveShopifyConnection}
                    disabled={!shopifyCredentials.shopDomain || !shopifyCredentials.accessToken || isSavingShopify}
                  >
                    {isSavingShopify ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      shopifyConnection?.isConnected ? 'Update Connection' : 'Connect Shopify'
                    )}
                  </Button>
                </div>

                {/* Setup Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Setup Instructions</h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Go to your Shopify admin → Settings → Apps and sales channels</li>
                    <li>Click "Develop apps" → "Create an app"</li>
                    <li>Configure Admin API scopes: read_products, read_inventory</li>
                    <li>Install the app and copy the Admin API access token</li>
                    <li>Paste your credentials above and click "Test Connection"</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Other Integrations Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>More Integrations Coming Soon</CardTitle>
                <CardDescription>
                  We're working on adding more integrations to help you manage your warehouse.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['WooCommerce', 'Amazon', 'eBay', 'BigCommerce'].map((platform) => (
                    <div
                      key={platform}
                      className="border rounded-lg p-4 text-center opacity-50"
                    >
                      <p className="text-sm font-medium">{platform}</p>
                      <p className="text-xs text-muted-foreground mt-1">Coming Soon</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other tabs content */}
        {activeTab !== "General" && activeTab !== "Invoice" && activeTab !== "Integrations" && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{activeTab} Settings</CardTitle>
              <CardDescription>
                Content for {activeTab} will go here.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}
