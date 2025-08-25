"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  Download,
  Plus,
  ShoppingCart,
  Clock,
  CheckCircle,
  DollarSign,
  MoreHorizontal,
  X,
  Minus,
  Package,
  FileText,
} from "lucide-react"

export default function OrdersPage() {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [invoiceItems, setInvoiceItems] = useState([])
  const [productSearch, setProductSearch] = useState("")
  const [customerInfo, setCustomerInfo] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    billingAddress: ""
  })

  // Mock inventory data - updated with fragrance products similar to your invoice
  const inventoryItems = [
    { sku: "ARM001", name: "M-ARMAF ODYSSEY DUBAI CHOCOLATE GOURMAN EDITION2.02 EDP SPR", value: "18.00", stock: 50, category: "Fragrances", description: "Premium chocolate gourmet fragrance edition" },
    { sku: "ARM002", name: "M-ARMAF ODYSSEY MANDARIN SKY 2.02 EDP SPR", value: "18.00", stock: 45, category: "Fragrances", description: "Fresh mandarin sky fragrance" },
    { sku: "ARM003", name: "M-ARMAF ODYSSEY HOMME BLACK (M) 2.02 EDP SPR", value: "17.00", stock: 30, category: "Fragrances", description: "Black edition men's fragrance" },
    { sku: "AHL001", name: "SPRAY AHLAM AL ARAB 100ML WITH DEO 50ML", value: "15.00", stock: 25, category: "Fragrances", description: "Traditional Arabian fragrance with deodorant" },
    { sku: "KHA001", name: "Khamrah for Unisex Eau de Parfum Spray, 3.4oz/ 100ml", value: "19.00", stock: 40, category: "Fragrances", description: "Unisex eau de parfum spray" },
    { sku: "RIQ001", name: "Spray Riqqa 100 Ml - (Ard)", value: "19.00", stock: 35, category: "Fragrances", description: "Ard collection fragrance spray" },
    { sku: "LAF001", name: "SPRAY LA FEDE COVETED SHADES 100 ML", value: "15.00", stock: 20, category: "Fragrances", description: "Coveted shades fragrance collection" },
    { sku: "LAF002", name: "SPRAY LA FEDE COVETED DIAMOND 100 ML", value: "15.00", stock: 28, category: "Fragrances", description: "Diamond collection luxury fragrance" },
    { sku: "AFN001", name: "9 AM By AFNAN DEP Spray Unisex 3.4 oz (BLUE)", value: "24.00", stock: 15, category: "Fragrances", description: "Morning fresh unisex fragrance" },
    { sku: "EFT001", name: "Spray Eftinaan 100ml", value: "15.00", stock: 22, category: "Fragrances", description: "Classic Eftinaan fragrance" },
    { sku: "SHA001", name: "Shams Al Emarat Khususi Pink Blush EDP Spray 100ML", value: "20.00", stock: 18, category: "Fragrances", description: "Pink blush eau de parfum" },
    { sku: "RAS001", name: "RASASI HAWAS FIRE 100ml", value: "32.00", stock: 12, category: "Fragrances", description: "Fire edition premium fragrance" },
  ]

  const stats = [
    {
      title: "Total Orders",
      value: "9",
      description: "This month",
      icon: ShoppingCart,
    },
    {
      title: "Pending Orders",
      value: "2",
      description: "Awaiting processing",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Ready to Ship",
      value: "2",
      description: "Prepared for shipment",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Revenue",
      value: "$124.5K",
      description: "This month",
      icon: DollarSign,
    },
  ]

  const orders = [
    {
      orderId: "ORD-12847",
      customer: "Acme Corp",
      email: "orders@acme.com",
      items: "25 items",
      total: "$2,847.50",
      status: "Processing",
      priority: "High",
      dueDate: "Dec 29, 2024",
      assignedTo: "John Smith",
    },
    {
      orderId: "ORD-12846",
      customer: "TechStart Inc",
      email: "procurement@techstart.com",
      items: "12 items",
      total: "$1,245.00",
      status: "Ready to Ship",
      priority: "Medium",
      dueDate: "Dec 28, 2024",
      assignedTo: "Sarah Johnson",
    },
    {
      orderId: "ORD-12845",
      customer: "Global Solutions",
      email: "supply@globalsol.com",
      items: "8 items",
      total: "$567.80",
      status: "Shipped",
      priority: "Low",
      dueDate: "Dec 27, 2024",
      assignedTo: "Mike Davis",
    },
    {
      orderId: "ORD-12844",
      customer: "Innovation Labs",
      email: "orders@innovlabs.com",
      items: "45 items",
      total: "$4,123.75",
      status: "Pending",
      priority: "High",
      dueDate: "Dec 30, 2024",
      assignedTo: "Lisa Chen",
    },
    {
      orderId: "ORD-12843",
      customer: "BuildCorp",
      email: "materials@buildcorp.com",
      items: "18 items",
      total: "$1,876.25",
      status: "Cancelled",
      priority: "Medium",
      dueDate: "Dec 28, 2024",
      assignedTo: "Tom Wilson",
    },
  ]

  // Filter products based on search
  const filteredProducts = inventoryItems.filter(item =>
      item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "Processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Ready to Ship":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Shipped":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "Pending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const addItemToInvoice = (product) => {
    const existingItem = invoiceItems.find(item => item.sku === product.sku)

    if (existingItem) {
      // If item already exists, increase quantity
      setInvoiceItems(invoiceItems.map(item =>
          item.sku === product.sku
              ? { ...item, quantity: item.quantity + 1 }
              : item
      ))
    } else {
      // Add new item
      setInvoiceItems([
        ...invoiceItems,
        {
          id: Date.now(),
          sku: product.sku,
          name: product.name,
          price: Number(product.value),
          quantity: 1
        }
      ])
    }
  }

  const removeItemFromInvoice = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id))
  }

  const updateInvoiceItem = (id, field, value) => {
    setInvoiceItems(invoiceItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const updateCustomerInfo = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const calculateTax = (subtotal) => {
    return subtotal * 0.085
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal + calculateTax(subtotal)
  }

  // PDF Generation Function
  const generateInvoicePDF = () => {
    // Load jsPDF from CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => {
      const { jsPDF } = window.jspdf
      const doc = new jsPDF()

      // Generate invoice number
      const invoiceNumber = `INV${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
      const currentDate = new Date().toLocaleDateString()

      // Company Header
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Desert Storm Fragrance", 20, 30)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("(901)319-9260", 20, 40)
      doc.text("(229)854-4536", 20, 45)
      doc.text("dsfragrance85@gmail.com", 20, 50)
      doc.text("1201 Eisenhower Pkwy, Macon, GA 31206", 20, 55)

      // Invoice Title
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("INVOICE", 150, 30)

      // Invoice Details
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`NUMBER: ${invoiceNumber}`, 150, 40)
      doc.text(`DATE: ${currentDate}`, 150, 45)

      // Bill To Section
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("BILL TO:", 20, 80)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(customerInfo.companyName || "Customer Name", 20, 90)
      if (customerInfo.phone) doc.text(customerInfo.phone, 20, 95)
      if (customerInfo.email) doc.text(customerInfo.email, 20, 100)
      if (customerInfo.billingAddress) {
        const addressLines = customerInfo.billingAddress.split('\n')
        addressLines.forEach((line, index) => {
          doc.text(line, 20, 105 + (index * 5))
        })
      }

      // Table Headers
      const startY = 130
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("Description", 20, startY)
      doc.text("Quantity", 120, startY)
      doc.text("Unit price", 145, startY)
      doc.text("Amount", 170, startY)

      // Draw line under headers
      doc.line(20, startY + 3, 190, startY + 3)

      // Invoice Items
      doc.setFont("helvetica", "normal")
      let currentY = startY + 15

      invoiceItems.forEach((item) => {
        // Handle long product names by wrapping text
        const splitText = doc.splitTextToSize(item.name, 90)
        doc.text(splitText, 20, currentY)
        doc.text(item.quantity.toString(), 125, currentY)
        doc.text(`$${item.price.toFixed(2)}`, 145, currentY)
        doc.text(`$${(item.quantity * item.price).toFixed(2)}`, 170, currentY)

        // Adjust Y position based on text height
        const textHeight = splitText.length * 5
        currentY += Math.max(textHeight, 10)
      })

      // Totals Section
      const subtotal = calculateSubtotal()
      const total = calculateTotal()

      const totalsY = currentY + 20
      doc.setFont("helvetica", "bold")
      doc.text("SUBTOTAL:", 145, totalsY)
      doc.text(`$${subtotal.toFixed(2)}`, 170, totalsY)

      doc.text("TOTAL:", 145, totalsY + 10)
      doc.text(`$${total.toFixed(2)}`, 170, totalsY + 10)

      doc.text("PAID:", 145, totalsY + 20)
      doc.text("$0.00", 170, totalsY + 20)

      doc.text("BALANCE DUE:   ", 145, totalsY + 35)
      doc.setTextColor(0, 0, 0) // Red color
      doc.text(`$${total.toFixed(2)}`, 175, totalsY + 35, {align: "left"}) 
      doc.setTextColor(0, 0, 0) // Reset to black

      // Payment Instructions
      doc.setFont("helvetica", "bold")
      doc.text("Payment instructions", 20, totalsY + 20)

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      const paymentInstructions = [
        "-Note: We now accept card payments via Stripe.",
        "A 4% processing fee will be added to credit card",
        "transactions.",
        "To avoid the fee, you may pay via",
        "-Check",
        "-Zelle Payments to:",
        "DSFRAGRANCE85@GMAIL.COM",
        "or",
        "(478)407-9793",
        "- Note: If you prefer to pay via wire transfer,",
        "please contact us for wire transfer instructions."
      ]

      paymentInstructions.forEach((instruction, index) => {
        doc.text(instruction, 20, totalsY + 35 + (index * 4))
      })

      // Save the PDF
      doc.save(`${invoiceNumber}.pdf`)
    }

    document.head.appendChild(script)
  }

  const handleCreateInvoice = () => {
    console.log("Creating invoice with data:", {
      customerInfo,
      items: invoiceItems,
      subtotal: calculateSubtotal(),
      tax: calculateTax(calculateSubtotal()),
      total: calculateTotal()
    })

    // Generate PDF
    generateInvoicePDF()

    // Reset form
    setInvoiceItems([])
    setCustomerInfo({
      companyName: "",
      contactPerson: "",
      email: "",
      phone: "",
      billingAddress: ""
    })
    setProductSearch("")
    setIsInvoiceModalOpen(false)
    alert("Invoice created and PDF generated successfully!")
  }

  // Function to generate PDF from existing order
  const generateOrderInvoice = (order) => {
    // Sample items for demonstration - in real app you'd fetch from order details
    const sampleItems = [
      { name: "M-ARMAF ODYSSEY DUBAI CHOCOLATE GOURMAN EDITION2.02 EDP SPR", quantity: 3, price: 18.00 },
      { name: "Khamrah for Unisex Eau de Parfum Spray, 3.4oz/ 100ml", quantity: 2, price: 19.00 },
      { name: "RASASI HAWAS FIRE 100ml", quantity: 1, price: 32.00 }
    ]

    // Load jsPDF from CDN
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => {
      const { jsPDF } = window.jspdf
      const doc = new jsPDF()

      // Generate invoice number based on order ID
      const invoiceNumber = order.orderId.replace('ORD', 'INV')
      const currentDate = new Date().toLocaleDateString()

      // Company Header
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Desert Storm Fragrance", 20, 30)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("(901)319-9260", 20, 40)
      doc.text("(229)854-4536", 20, 45)
      doc.text("dsfragrance85@gmail.com", 20, 50)
      doc.text("1201 Eisenhower Pkwy, Macon, GA 31206", 20, 55)

      // Invoice Title
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("INVOICE", 150, 30)

      // Invoice Details
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`NUMBER: ${invoiceNumber}`, 150, 40)
      doc.text(`DATE: ${currentDate}`, 150, 45)

      // Bill To Section
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("BILL TO:", 20, 80)

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(order.customer, 20, 90)
      doc.text(order.email, 20, 95)

      // Table Headers
      const startY = 120
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("Description", 20, startY)
      doc.text("Quantity", 120, startY)
      doc.text("Unit price", 145, startY)
      doc.text("Amount", 170, startY)

      // Draw line under headers
      doc.line(20, startY + 3, 190, startY + 3)

      // Invoice Items
      doc.setFont("helvetica", "normal")
      let currentY = startY + 15
      let subtotal = 0

      sampleItems.forEach((item) => {
        const itemTotal = item.quantity * item.price
        subtotal += itemTotal

        const splitText = doc.splitTextToSize(item.name, 90)
        doc.text(splitText, 20, currentY)
        doc.text(item.quantity.toString(), 125, currentY)
        doc.text(`$${item.price.toFixed(2)}`, 145, currentY)
        doc.text(`$${itemTotal.toFixed(2)}`, 170, currentY)

        const textHeight = splitText.length * 5
        currentY += Math.max(textHeight, 10)
      })

      // Totals Section
      const totalsY = currentY + 20
      doc.setFont("helvetica", "bold")
      doc.text("SUBTOTAL:", 145, totalsY)
      doc.text(`$${subtotal.toFixed(2)}`, 170, totalsY)

      doc.text("TOTAL:", 145, totalsY + 10)
      doc.text(`$${subtotal.toFixed(2)}`, 170, totalsY + 10)

      doc.text("PAID:", 145, totalsY + 20)
      doc.text("$0.00", 170, totalsY + 20)

      doc.text("BALANCE DUE:", 145, totalsY + 35)
      doc.setTextColor(255, 0, 0)
      doc.text(`$${subtotal.toFixed(2)}`, 170, totalsY + 35)

      // Save the PDF
      doc.save(`${invoiceNumber}.pdf`)
    }

    document.head.appendChild(script)
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setIsInvoiceModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </div>

          {/* Invoice Modal - Following Your Sketch Design */}
          {isInvoiceModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-[98vw] max-h-[98vh] overflow-y-auto">
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Invoice</h2>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsInvoiceModalOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Top Section: Two Columns */}
                    <div className="grid grid-cols-2 gap-8 mb-8">

                      {/* LEFT COLUMN: Product Search & Selection */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Search Products</h3>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                                placeholder="Search products..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="pl-10 h-12 text-base"
                            />
                          </div>
                        </div>

                        {/* Product Cards */}
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {filteredProducts.map((product) => (
                              <Card key={product.sku} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                        <Package className="h-8 w-8 text-gray-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">
                                          {product.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                          {product.description}
                                        </p>
                                        <div className="flex items-center space-x-4">
                                          <span className="text-lg font-bold text-green-600">${product.value}</span>
                                          <Badge variant="outline" className="text-xs">
                                            {product.category}
                                          </Badge>
                                          <span className="text-sm text-gray-500">
                                            Stock: {product.stock}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                        onClick={() => addItemToInvoice(product)}
                                        size="sm"
                                        disabled={product.stock <= 0}
                                        className="ml-4"
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Item
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                          ))}
                        </div>
                      </div>

                      {/* RIGHT COLUMN: Customer Information */}
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Customer Information</h3>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Company Name *
                              </label>
                              <Input
                                  placeholder="Enter company name"
                                  value={customerInfo.companyName}
                                  onChange={(e) => updateCustomerInfo('companyName', e.target.value)}
                                  className="h-12"
                                  required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Contact Person
                              </label>
                              <Input
                                  placeholder="Enter contact name"
                                  value={customerInfo.contactPerson}
                                  onChange={(e) => updateCustomerInfo('contactPerson', e.target.value)}
                                  className="h-12"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Email Address *
                              </label>
                              <Input
                                  type="email"
                                  placeholder="Enter email address"
                                  value={customerInfo.email}
                                  onChange={(e) => updateCustomerInfo('email', e.target.value)}
                                  className="h-12"
                                  required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Phone Number
                              </label>
                              <Input
                                  placeholder="Enter phone number"
                                  value={customerInfo.phone}
                                  onChange={(e) => updateCustomerInfo('phone', e.target.value)}
                                  className="h-12"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Billing Address
                            </label>
                            <textarea
                                placeholder="Enter billing address"
                                value={customerInfo.billingAddress}
                                onChange={(e) => updateCustomerInfo('billingAddress', e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Invoice Items & Summary */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-8">
                      <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Invoice Items</h3>

                      {invoiceItems.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No items added to invoice yet</p>
                            <p className="text-sm">Search and add products from the left panel</p>
                          </div>
                      ) : (
                          <div className="space-y-6">
                            {/* Items Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Product</th>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-32">Quantity</th>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-32">Price</th>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-32">Total</th>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-20">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {invoiceItems.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                                      <td className="py-4 px-4">
                                        <div>
                                          <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                          <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.sku}</div>
                                        </div>
                                      </td>
                                      <td className="py-4 px-4">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateInvoiceItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="w-20"
                                        />
                                      </td>
                                      <td className="py-4 px-4">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={item.price}
                                            onChange={(e) => updateInvoiceItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                            className="w-24"
                                        />
                                      </td>
                                      <td className="py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">
                                        ${(item.quantity * item.price).toFixed(2)}
                                      </td>
                                      <td className="py-4 px-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeItemFromInvoice(item.id)}
                                        >
                                          <Minus className="h-4 w-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Summary */}
                            <div className="flex justify-end">
                              <div className="w-80 space-y-3 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                                <div className="flex justify-between text-gray-900 dark:text-gray-100">
                                  <span className="font-medium">Subtotal:</span>
                                  <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-900 dark:text-gray-100">
                                  <span className="font-medium">Tax (8.5%):</span>
                                  <span className="font-semibold">${calculateTax(calculateSubtotal()).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-gray-100">
                                    <span>Total:</span>
                                    <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                      <Button
                          variant="outline"
                          onClick={() => setIsInvoiceModalOpen(false)}
                          className="px-8 py-3"
                      >
                        Cancel
                      </Button>
                      <Button
                          onClick={handleCreateInvoice}
                          disabled={invoiceItems.length === 0 || !customerInfo.companyName || !customerInfo.email}
                          className="px-8 py-3"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Create Invoice & PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color || "text-blue-600"}`} />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${stat.color || ""}`}>{stat.value}</div>
                      <p className="text-xs text-gray-600">{stat.description}</p>
                    </CardContent>
                  </Card>
              )
            })}
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 border-b">
              <Button variant="ghost" className="border-b-2 border-blue-500 text-blue-600">
                All Orders
              </Button>
              <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
                Pending (2)
              </Button>
              <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
                Processing (2)
              </Button>
              <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
                Ready to Ship (2)
              </Button>
              <Button variant="ghost" className="text-gray-600 dark:text-gray-400">
                Shipped (2)
              </Button>
            </div>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>Complete list of warehouse orders (9 orders)</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search orders..." className="pl-10" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="ready">Ready to Ship</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Items</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Assigned To</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {orders.map((order, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4 font-medium text-blue-600">{order.orderId}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{order.customer}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{order.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{order.items}</td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{order.total}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getPriorityColor(order.priority)}>{order.priority}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{order.dueDate}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{order.assignedTo}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateOrderInvoice(order)}
                                title="Generate Invoice PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}