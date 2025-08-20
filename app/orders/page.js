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
} from "lucide-react"
import {useInventoryStats} from "../../hooks/InventoryStats";

export default function OrdersPage() {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [invoiceItems, setInvoiceItems] = useState([
    { id: 1, product: "", quantity: 1, price: 0 }
  ])

  const {inventoryItems, stats1, loading, refresh } = useInventoryStats();

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

  const availableProducts = inventoryItems.map(item => ({
    id: item.sku, // Use SKU as ID since it's unique
    name: item.name,
    price: Number(item.value),
    stock: item.stock,
    category: item.category,
    isOutOfStock: item.stock <= 0
  }))


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

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { id: Date.now(), product: "", quantity: 1, price: 0 }
    ])
  }

  const removeInvoiceItem = (id) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter(item => item.id !== id))
    }
  }

  const updateInvoiceItem = (id, field, value) => {
    setInvoiceItems(invoiceItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // --- FIX: Automatically set price when product is selected ---
  const handleProductSelect = (itemId, productId) => {
    const product = availableProducts.find(p => p.id.toString() === productId)
    if (product) {
      setInvoiceItems(invoiceItems.map(item =>
          item.id === itemId
              ? { ...item, product: product.name, price: product.price }
              : item
      ))
    }
  }

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0)
  }

  const calculateTax = (subtotal) => {
    return subtotal * 0.085
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    return subtotal + calculateTax(subtotal)
  }

  const handleCreateInvoice = () => {
    const formData = new FormData(document.getElementById('invoice-form'))
    console.log("Creating invoice with data:", {
      companyName: formData.get('company-name'),
      contactPerson: formData.get('contact-person'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      billingAddress: formData.get('billing-address'),
      items: invoiceItems,
      total: calculateTotal()
    })
    setInvoiceItems([{ id: 1, product: "", quantity: 1, price: 0 }])
    setIsInvoiceModalOpen(false)
    alert("Invoice created successfully!")
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

          {/* Invoice Modal */}
          {isInvoiceModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Invoice</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Fill in the customer information and select items for the invoice.
                        </p>
                      </div>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsInvoiceModalOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <form id="invoice-form" className="space-y-6">
                      {/* Customer Information */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label htmlFor="company-name" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Company Name *
                            </label>
                            <Input
                                id="company-name"
                                name="company-name"
                                placeholder="Enter company name"
                                required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="contact-person" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Contact Person
                            </label>
                            <Input
                                id="contact-person"
                                name="contact-person"
                                placeholder="Enter contact name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Email Address *
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter email address"
                                required
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="phone" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Phone Number
                            </label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="Enter phone number"
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <label htmlFor="billing-address" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Billing Address
                          </label>
                          <textarea
                              id="billing-address"
                              name="billing-address"
                              placeholder="Enter billing address"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      {/* Items Section */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoice Items</h3>
                          <Button type="button" onClick={addInvoiceItem} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {invoiceItems.map((item) => (
                              <div key={item.id} className="flex items-end gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                                <div className="flex-1">
                                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Product</label>
                                  <Select onValueChange={(value) => handleProductSelect(item.id, value)}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select Product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableProducts.map((product) => (
                                          <SelectItem key={product.id} value={product.id.toString()}>
                                            {product.name} - ${product.price}
                                          </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="w-24">
                                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Quantity</label>
                                  <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateInvoiceItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                  />
                                </div>

                                <div className="w-32">
                                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Price</label>
                                  <Input
                                      type="number"
                                      step="0.01"
                                      value={item.price}
                                      onChange={(e) => updateInvoiceItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                  />
                                </div>

                                <div className="w-32">
                                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-1">Total</label>
                                  <div className="h-10 flex items-center px-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100">
                                    ${(item.quantity * item.price).toFixed(2)}
                                  </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeInvoiceItem(item.id)}
                                    disabled={invoiceItems.length === 1}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                          ))}
                        </div>
                      </div>

                      {/* Invoice Summary */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div className="flex justify-end">
                          <div className="w-64 space-y-2">
                            <div className="flex justify-between text-gray-900 dark:text-gray-100">
                              <span>Subtotal:</span>
                              <span>${calculateSubtotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-900 dark:text-gray-100">
                              <span>Tax (8.5%):</span>
                              <span>${calculateTax(calculateSubtotal()).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg border-t border-gray-200 dark:border-gray-600 pt-2 text-gray-900 dark:text-gray-100">
                              <span>Total:</span>
                              <span>${calculateTotal().toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-600 pt-4">
                        <Button variant="outline" onClick={() => setIsInvoiceModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={handleCreateInvoice}>
                          Create Invoice
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
          )}

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
                          <Button size="sm" variant="outline">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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