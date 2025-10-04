"use client"

//Orders Page
import { useState } from "react"
import {useEffect} from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import {useInventoryStats} from "../../hooks/InventoryStats";
import Orders from "./classes/OrdersManager";

export default function OrdersPage() {
  const [invoiceItems, setInvoiceItems] = useState([])
  const [productSearch, setProductSearch] = useState("")
  const [orderManager, setOrderManager] = useState(null);
  const [activeTab, setActiveTab] = useState("all") // all, processing, completed
  const [logoData, setLogoData] = useState(null); // Add state for logo
  const API_BASE = '';
  const [allCustomers, setAllCustomers] = useState([]);
  const [partialPayments, setPartialPayments] = useState([])
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null)
  const [newPartialPaymentAmount, setNewPartialPaymentAmount] = useState("")

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [editOrderItems, setEditOrderItems] = useState([])
  const [editCustomerInfo, setEditCustomerInfo] = useState({})
  const [orders, setOrders] = useState([
    {
      orderId: "ORD-12847",
      customer: "Acme Corp",
      email: "orders@acme.com",
      phone: "(555) 123-4567",
      billingAddress: "123 Main St\nAnytown, ST 12345",
      items: [
        { name: "Sample Product", quantity: 25, price: 113.90 }
      ],
      subtotal: 2847.50,
      total: 2847.50,
      status: "Processing",
      priority: "High",
      dueDate: "Dec 29, 2024",
      assignedTo: "John Smith",
    }
  ]);
  const [customerInfo, setCustomerInfo] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    billingAddress: ""
  })

  // Load logo on component mount
  useEffect(() => {
    const loadLogo = async () => {
      try {
        // Method 1: Try to load from public folder as URL and convert to base64
        const response = await fetch('/DesertStorm.png');
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = () => {
            setLogoData(reader.result);
          };
          reader.readAsDataURL(blob);
        } else {
          console.warn('Logo not found in public folder');
        }
      } catch (error) {
        console.error('Failed to load logo:', error);
        // Fallback: use a hardcoded base64 string if needed
        // setLogoData("data:image/png;base64,YOUR_BASE64_STRING_HERE");
      }
    };

    loadLogo();
  }, []);

  useEffect(() => {
    if (isInvoiceModalOpen) {
      fetch("/api/people")
          .then((res) => res.json())
          .then((all) => setAllCustomers(all.filter((p) => p.type === "customer")))
          .catch((err) => console.error("Failed loading customers", err))
    }
  }, [isInvoiceModalOpen])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Keep the initial mock data if fetch fails
    }
  };
  // Add this after your state declarations
  useEffect(() => {
    const loadOrders = async () => {
      await fetchOrders();
    };

    loadOrders(); // call it here
  }, []);

  // Mock inventory data - updated with fragrance products similar to your invoice
  const {inventoryItems, statistics, loading, refresh } = useInventoryStats();

  useEffect(() => {
    const manager = new Orders(orders);
    setOrderManager(manager);
  }, [orders]); // Update when orders change

  // Don't render until orderManager is ready
  if (!orderManager) {
    return <div>Loading...</div>;
  }

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === "processing") return order.status === "Processing"
    if (activeTab === "completed") return order.status === "Completed"
    return true // "all" tab shows everything
  })

  const stats = [
    {
      title: "Total Orders",
      value: orders.length.toString(),
      description: "All time",
      icon: ShoppingCart,
    },
    {
      title: "Processing Orders",
      value: orders.filter(order => order.status === "Processing").length.toString(),
      description: "Currently processing",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Completed Orders",
      value: orders.filter(order => order.status === "Completed").length.toString(),
      description: "Successfully completed",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Revenue",
      value: `${(orders.reduce((sum, order) => sum + order.total, 0) / 1000).toFixed(1)}K`,
      description: "All time",
      icon: DollarSign,
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
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
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
          quantity: 1,
          category: product.category?.name
        }
      ])
    }
  }

  const openEditModal = async (order) => {
    setEditingOrder(order)
    setEditOrderItems([...order.items])
    setEditCustomerInfo({
      companyName: order.customer,
      email: order.email,
      phone: order.phone,
      billingAddress: order.billingAddress
    })
    setIsEditModalOpen(true)
    // Fetch partial payments for this order
    await fetchPartialPayments(order.id)
  }

  const updateEditOrderItem = (id, field, value) => {
    setEditOrderItems(editOrderItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeEditOrderItem = (id) => {
    setEditOrderItems(editOrderItems.filter(item => item.id !== id))
  }

  const addProductToEditOrder = (product) => {
    const newItem = {
      id: Date.now(),
      sku: product.sku,
      name: product.name,
      price: product.value,
      quantity: 1,
      productId: product.id
    }
    setEditOrderItems([...editOrderItems, newItem])
  }

  const deletePartialPayment = async (paymentId) => {
    if (!confirm('Delete this payment?')) return

    try {
      const response = await fetch(`/api/orders/${editingOrder.id}/partial-payments/${paymentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete payment')

      setPartialPayments(partialPayments.filter(p => p.id !== paymentId))
      alert('Payment deleted')
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Failed to delete payment')
    }
  }

  const handleUpdateOrder = async () => {
    try {
      const updatedOrder = {
        customer: editCustomerInfo.companyName,
        email: editCustomerInfo.email,
        phone: editCustomerInfo.phone,
        billingAddress: editCustomerInfo.billingAddress,
        items: editOrderItems.map(item => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          productId: item.productId
        })),
        subtotal: editOrderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0),
        total: editOrderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0)
      }

      const response = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      })

      if (!response.ok) throw new Error('Failed to update order')

      const savedOrder = await response.json()
      setOrders(orders.map(o => o.id === savedOrder.id ? savedOrder : o))
      setIsEditModalOpen(false)
      alert('Order updated successfully!')
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
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

  const calculateSubtotal = (items = invoiceItems) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
  }

  const calculateTax = (subtotal) => {
    return subtotal * 0.085
  }

  const calculateTotal = (items = invoiceItems) => {
    return calculateSubtotal(items)
  }

  const openPaymentModal = (order) => {
    setSelectedOrderForPayment(order)
    setIsPaymentModalOpen(true)
    fetchPartialPayments(order.id)
  }

  // Toggle order status between Processing and Completed
  const toggleOrderStatus = async (orderId) => {
    try {
      // Find the order in our state
      const order = orders.find(o => o.orderId === orderId);
      if (!order) return;

      // Determine the new status
      const newStatus = order.status === "Processing" ? "Completed" : "Processing";

      // Update in the database
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order status');

      // Update the local state
      setOrders(prevOrders =>
          prevOrders.map(o =>
              o.orderId === orderId
                  ? { ...o, status: newStatus }
                  : o
          )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  // Simplified PDF Generation Function - expects base64 logo data
  const generateInvoicePDF = (orderData, items, isNewInvoice = false, logoBase64, totalPaid = 0) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'

      script.onload = () => {
        const autoTableScript = document.createElement('script')
        autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'

        autoTableScript.onload = async () => {
          try {
            const { jsPDF } = window.jspdf
            const doc = new jsPDF()

            // Generate invoice number
            const invoiceNumber = isNewInvoice
                ? `INV${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
                : orderData.orderId.replace('ORD', 'INV')
            const currentDate = new Date(orderData.createdAt).toLocaleDateString()

            // === HEADER ===
            if (logoBase64) {
              try {
                doc.addImage(logoBase64, "PNG", 15, 10, 40, 25) // logo
              } catch (error) {
                console.warn('Failed to add logo to PDF:', error);
              }
            }

            doc.setFontSize(16)
            doc.setFont("helvetica", "bold")
            doc.text("Desert Storm Fragrance", 70, 20)

            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.text("(901)319-9260", 70, 28)
            doc.text("(229)854-4536", 70, 33)
            doc.text("dsfragrance85@gmail.com", 70, 38)
            doc.text("1201 Eisenhower Pkwy, Macon, GA 31206", 70, 43)

            // Invoice Title
            doc.setFontSize(18)
            doc.setFont("helvetica", "bold")
            doc.text("INVOICE", 170, 20)

            // Invoice Details
            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.text(`NUMBER: ${invoiceNumber}`, 170, 30)
            doc.text(`DATE: ${currentDate}`, 170, 35)

            // === BILL TO ===
            doc.setFontSize(12)
            doc.setFont("helvetica", "bold")
            doc.text("BILL TO:", 15, 60)

            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            const customerName = isNewInvoice ? customerInfo.companyName : orderData.customer
            const customerEmail = isNewInvoice ? customerInfo.email : orderData.email
            const customerPhone = isNewInvoice ? customerInfo.phone : orderData.phone
            const customerAddress = isNewInvoice ? customerInfo.billingAddress : orderData.billingAddress

            doc.text(customerName || "Customer Name", 15, 70)
            if (customerPhone) doc.text(customerPhone, 15, 75)
            if (customerEmail) doc.text(customerEmail, 15, 80)
            if (customerAddress) {
              const addressLines = customerAddress.split('\n')
              addressLines.forEach((line, index) => {
                doc.text(line, 15, 85 + (index * 5))
              })
            }

            // === INVOICE ITEMS TABLE ===
            const tableData = items.map(item => [
              item.name,
              item.quantity.toString(),
              `$${item.price.toFixed(2)}`,
              `$${(item.quantity * item.price).toFixed(2)}`
            ])

            doc.autoTable({
              startY: 110,
              head: [["Description", "Quantity", "Unit Price", "Amount"]],
              body: tableData,
              styles: { font: "helvetica", fontSize: 10, cellPadding: 3 },
              headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: "bold" },
              tableLineColor: [200, 200, 200],
              tableLineWidth: 0.2,
              columnStyles: {
                0: { cellWidth: 95 }, // Description
                1: { cellWidth: 25, halign: "center" },
                2: { cellWidth: 30, halign: "right" },
                3: { cellWidth: 30, halign: "right" }
              }
            })

            // === TOTALS ===
            const subtotal = calculateSubtotal(items)
            const total = calculateTotal(items)
            const balanceDue = total - totalPaid

            let finalY = doc.lastAutoTable.finalY + 10

            doc.setFont("helvetica", "bold")
            doc.text("SUBTOTAL:", 145, finalY)
            doc.text(`$${subtotal.toFixed(2)}`, 180, finalY)

            doc.text("TOTAL:", 145, finalY + 10)
            doc.text(`$${total.toFixed(2)}`, 180, finalY + 10)

            // Show actual paid amount
            doc.setTextColor(0, 128, 0) // Green for paid
            doc.text("PAID:", 145, finalY + 20)
            doc.text(`$${totalPaid.toFixed(2)}`, 180, finalY + 20)
            doc.setTextColor(0, 0, 0) // Reset to black

            // Show balance due
            doc.setTextColor(255, 0, 0) // Red for balance
            doc.text("BALANCE DUE:", 145, finalY + 35)
            doc.text(`$${balanceDue.toFixed(2)}`, 180, finalY + 35)
            doc.setTextColor(0, 0, 0) // Reset to black

            // ... (rest of your payment instructions code stays the same)

            doc.save(`${invoiceNumber}.pdf`)
            resolve(invoiceNumber)
          } catch (error) {
            reject(error)
          }
        }

        autoTableScript.onerror = () => reject(new Error("Failed to load jsPDF AutoTable"))
        document.head.appendChild(autoTableScript)
      }

      script.onerror = () => reject(new Error("Failed to load jsPDF"))
      document.head.appendChild(script)
    })
  }

  // Function to delete an order
  const deleteOrder = async (orderId, orderDbId) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderDbId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete order');

      // Remove from local state
      setOrders(prevOrders => prevOrders.filter(order => order.orderId !== orderId));
      alert('Order deleted successfully!');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const fetchPartialPayments = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/partial-payments`)
      if (response.ok) {
        const payments = await response.json()
        setPartialPayments(payments)
      }
    } catch (error) {
      console.error('Error fetching partial payments:', error)
    }
  }

  // Add partial payment
  const handleAddPartialPayment = async () => {
    if (!newPartialPaymentAmount || parseFloat(newPartialPaymentAmount) <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    // Determine which order we're working with
    const targetOrder = isEditModalOpen ? editingOrder : selectedOrderForPayment

    if (!targetOrder) {
      alert("No order selected")
      return
    }

    const amount = parseFloat(newPartialPaymentAmount)
    const totalPaid = partialPayments.reduce((sum, p) => sum + p.amount, 0)
    const balanceDue = targetOrder.total - totalPaid

    if (amount > balanceDue) {
      alert(`Payment amount ($${amount.toFixed(2)}) exceeds balance due ($${balanceDue.toFixed(2)})`)
      return
    }

    try {
      const response = await fetch(`/api/orders/${targetOrder.id}/partial-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add payment')
      }

      const payment = await response.json()
      setPartialPayments([payment, ...partialPayments])
      setNewPartialPaymentAmount("")
      alert("Payment recorded successfully!")
    } catch (error) {
      console.error('Error adding partial payment:', error)
      alert(`Failed to record payment: ${error.message}`)
    }
  }

  // Calculate totals with partial payments
  const calculateBalanceDue = (order, payments) => {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    return order.total - totalPaid
  }

  const handleCreateInvoice = async () => {
    try {
      // Generate the invoice number before using it
      const tempInvoiceNumber = `INV${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Create new order object using tempInvoiceNumber
      const newOrder = {
        orderId: tempInvoiceNumber.replace('INV', 'ORD'),
        customer: customerInfo.companyName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        billingAddress: customerInfo.billingAddress,
        items: invoiceItems.map(item => ({
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          productId: inventoryItems.find(p => p.sku === item.sku)?.id || null
        })),
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        status: "Processing",
        priority: "Medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        assignedTo: "System",
        adjustedBy: "User"
      };

      console.log('Sending order data:', newOrder);

      // Save to database FIRST
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Failed to save order: ${errorText}`);
      }

      const savedOrder = await response.json();
      console.log('Saved order:', savedOrder);

      // Generate PDF AFTER successful save
      // In handleCreateInvoice function, update this line:
      const invoiceNumber = await generateInvoicePDF(savedOrder, savedOrder.items, false, logoData, 0);

      // Update orders state
      setOrders(prevOrders => [savedOrder, ...prevOrders]);

      // Reset form
      setInvoiceItems([]);
      setCustomerInfo({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        billingAddress: ""
      });
      setProductSearch("");
      setIsInvoiceModalOpen(false);
      alert("Invoice created and PDF generated successfully!");

    } catch (error) {
      console.error("Error creating invoice:", error);
      alert(`Error creating invoice: ${error.message}`);
    }
  };



  // Function to generate PDF from existing order
  // Function to generate PDF from existing order
  const generateOrderInvoice = async (order) => {
    try {
      // Fetch partial payments for this order
      const paymentsResponse = await fetch(`/api/orders/${order.id}/partial-payments`)
      let totalPaid = 0

      if (paymentsResponse.ok) {
        const payments = await paymentsResponse.json()
        totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      }

      await generateInvoicePDF(order, order.items, false, logoData, totalPaid)
      alert("Invoice PDF generated successfully!")
    } catch (error) {
      console.error("Error generating invoice:", error)
      alert("Error generating invoice PDF. Please try again.")
    }
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>
              {/* Debug info - remove this in production */}
              {/*logoData && <p className="text-sm text-green-600">Logo loaded successfully</p>*/}
              {!logoData && <p className="text-sm text-orange-600">Logo not loaded</p>}
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setIsInvoiceModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </div>

          {/* Partial Payment Modal */}


          {/* Partial Payment Modal */}
          {isPaymentModalOpen && selectedOrderForPayment && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Manage Payments</h2>
                      <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsPaymentModalOpen(false)
                            setPartialPayments([])
                            setNewPartialPaymentAmount("")
                          }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold text-lg mb-2">{selectedOrderForPayment.orderId}</h3>
                      <p className="text-sm text-gray-600">{selectedOrderForPayment.customer}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Order Total:</span>
                          <span className="font-bold">${selectedOrderForPayment.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span className="font-medium">Total Paid:</span>
                          <span className="font-bold">
                        ${partialPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                      </span>
                        </div>
                        <div className="flex justify-between text-red-600 text-lg pt-2 border-t">
                          <span className="font-bold">Balance Due:</span>
                          <span className="font-bold">
                        ${calculateBalanceDue(selectedOrderForPayment, partialPayments).toFixed(2)}
                      </span>
                        </div>
                      </div>
                    </div>

                    {/* Add Payment Form */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">Add Partial Payment</label>
                      <div className="flex space-x-2">
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter amount"
                            value={newPartialPaymentAmount}
                            onChange={(e) => setNewPartialPaymentAmount(e.target.value)}
                            className="flex-1"
                        />
                        <Button onClick={handleAddPartialPayment}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Payment
                        </Button>
                      </div>
                    </div>

                    {/* Payment History */}
                    <div>
                      <h3 className="font-semibold mb-3">Payment History</h3>
                      {partialPayments.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No payments recorded yet</p>
                      ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {partialPayments.map((payment) => (
                                <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                  <div>
                                    <p className="font-semibold text-green-600">${payment.amount.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(payment.paidAt).toLocaleDateString()} at {new Date(payment.paidAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Edit Order Modal */}
          {isEditModalOpen && editingOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Edit Order: {editingOrder.orderId}
                      </h2>
                      <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                      {/* LEFT: Product Search */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Products</h3>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <Input
                              placeholder="Search products..."
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              className="pl-10"
                          />
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {filteredProducts.slice(0, 5).map((product) => (
                              <Card key={product.sku} className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardContent className="p-3 flex justify-between items-center">
                                  <div>
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-gray-500">${product.value}</p>
                                  </div>
                                  <Button size="sm" onClick={() => addProductToEditOrder(product)}>
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </CardContent>
                              </Card>
                          ))}
                        </div>
                      </div>

                      {/* RIGHT: Customer Info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Customer Information</h3>
                        <Input
                            placeholder="Company Name"
                            value={editCustomerInfo.companyName}
                            onChange={(e) => setEditCustomerInfo({...editCustomerInfo, companyName: e.target.value})}
                        />
                        <Input
                            placeholder="Email"
                            value={editCustomerInfo.email}
                            onChange={(e) => setEditCustomerInfo({...editCustomerInfo, email: e.target.value})}
                        />
                        <Input
                            placeholder="Phone"
                            value={editCustomerInfo.phone || ''}
                            onChange={(e) => setEditCustomerInfo({...editCustomerInfo, phone: e.target.value})}
                        />
                        <textarea
                            placeholder="Billing Address"
                            value={editCustomerInfo.billingAddress || ''}
                            onChange={(e) => setEditCustomerInfo({...editCustomerInfo, billingAddress: e.target.value})}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Order Items</h3>
                      <table className="w-full">
                        <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Item</th>
                          <th className="text-left py-2">Qty</th>
                          <th className="text-left py-2">Price</th>
                          <th className="text-left py-2">Total</th>
                          <th className="text-left py-2">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {editOrderItems.map((item) => (
                            <tr key={item.id} className="border-b">
                              <td className="py-2">{item.name}</td>
                              <td className="py-2">
                                <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateEditOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-20"
                                />
                              </td>
                              <td className="py-2">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) => updateEditOrderItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-24"
                                />
                              </td>
                              <td className="py-2 font-semibold">${(item.quantity * item.price).toFixed(2)}</td>
                              <td className="py-2">
                                <Button size="sm" variant="outline" onClick={() => removeEditOrderItem(item.id)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end mt-4">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                          <p className="text-xl font-bold">
                            Total: ${editOrderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Partial Payments */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Partial Payments</h3>
                      {partialPayments.length === 0 ? (
                          <p className="text-sm text-gray-500">No payments yet</p>
                      ) : (
                          <div className="space-y-2">
                            {partialPayments.map((payment) => (
                                <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                  <div>
                                    <p className="font-semibold text-green-600">${payment.amount.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">{new Date(payment.paidAt).toLocaleString()}</p>
                                  </div>
                                  <Button size="sm" variant="outline" onClick={() => deletePartialPayment(payment.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                            ))}
                          </div>
                      )}
                      <div className="flex space-x-2 mt-3">
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="Add payment amount"
                            value={newPartialPaymentAmount}
                            onChange={(e) => setNewPartialPaymentAmount(e.target.value)}
                        />
                        <Button onClick={handleAddPartialPayment}>Add Payment</Button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                      <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                      <Button onClick={handleUpdateOrder}>Save Changes</Button>
                    </div>
                  </div>
                </div>
              </div>
          )}
          
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
                                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                        {product.image ? (
                                            <img
                                                src={`${API_BASE}${product.image}`}  // Add your backend URL
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                  console.log('Image failed to load:', product.image);
                                                  e.target.style.display = 'none';
                                                }}
                                                onLoad={() => console.log('Image loaded successfully:', product.image)}
                                            />
                                        ) : (
                                            <Package className="h-8 w-8 text-gray-400" />
                                        )}
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
                                            {product.category?.name}
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

                        <div className="mb-2 relative">
                          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Search Saved Customer
                          </label>
                          <Input
                              placeholder="Search company, name, or email"
                              value={customerInfo._search || ""}
                              onChange={(e) =>
                                  setCustomerInfo((prev) => ({
                                    ...prev,
                                    _search: e.target.value,
                                  }))
                              }
                              className="h-12"
                          />
                          {customerInfo._search && (
                              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded mt-1 max-h-44 overflow-y-auto shadow z-30 absolute left-0 right-0">
                                {allCustomers
                                    .filter(
                                        (c) =>
                                            (c.company || "")
                                                .toLowerCase()
                                                .includes(customerInfo._search.toLowerCase()) ||
                                            (c.name || "")
                                                .toLowerCase()
                                                .includes(customerInfo._search.toLowerCase()) ||
                                            (c.email || "").toLowerCase().includes(customerInfo._search.toLowerCase())
                                    )
                                    .slice(0, 8)
                                    .map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition text-gray-900 dark:text-gray-100"
                                            onClick={() => {
                                              setCustomerInfo({
                                                companyName: customer.company || customer.name,
                                                contactPerson: customer.name,
                                                email: customer.email || "",
                                                phone: customer.phone || "",
                                                billingAddress: customer.address || "",
                                                _search: "",
                                              })
                                            }}
                                        >
                                          <div className="font-semibold">{customer.company || customer.name}</div>
                                          <div className="text-xs text-gray-500">
                                            {customer.email}
                                            {customer.phone ? ` • ${customer.phone}` : ""}
                                          </div>
                                        </div>
                                    ))}
                                {allCustomers.filter(
                                    (c) =>
                                        (c.company || "").toLowerCase().includes(customerInfo._search.toLowerCase()) ||
                                        (c.name || "").toLowerCase().includes(customerInfo._search.toLowerCase()) ||
                                        (c.email || "").toLowerCase().includes(customerInfo._search.toLowerCase())
                                ).length === 0 && (
                                    <div className="px-4 py-2 text-gray-400 text-xs">No matches</div>
                                )}
                              </div>
                          )}
                        </div>



                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Company Name *</label>
                              <Input
                                  placeholder="Enter company name"
                                  value={customerInfo.companyName}
                                  onChange={(e) => updateCustomerInfo("companyName", e.target.value)}
                                  className="h-12"
                                  required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Contact Person</label>
                              <Input
                                  placeholder="Enter contact name"
                                  value={customerInfo.contactPerson}
                                  onChange={(e) => updateCustomerInfo("contactPerson", e.target.value)}
                                  className="h-12"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Address *</label>
                              <Input
                                  type="email"
                                  placeholder="Enter email address"
                                  value={customerInfo.email}
                                  onChange={(e) => updateCustomerInfo("email", e.target.value)}
                                  className="h-12"
                                  required
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Phone Number</label>
                              <Input
                                  placeholder="Enter phone number"
                                  value={customerInfo.phone}
                                  onChange={(e) => updateCustomerInfo("phone", e.target.value)}
                                  className="h-12"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Billing Address</label>
                            <textarea
                                placeholder="Enter billing address"
                                value={customerInfo.billingAddress}
                                onChange={(e) => updateCustomerInfo("billingAddress", e.target.value)}
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
              <Button
                  variant="ghost"
                  className={`${activeTab === "all" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 dark:text-gray-400"}`}
                  onClick={() => setActiveTab("all")}
              >
                All Orders ({orders.length})
              </Button>
              <Button
                  variant="ghost"
                  className={`${activeTab === "processing" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 dark:text-gray-400"}`}
                  onClick={() => setActiveTab("processing")}
              >
                Processing ({orders.filter(order => order.status === "Processing").length})
              </Button>
              <Button
                  variant="ghost"
                  className={`${activeTab === "completed" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600 dark:text-gray-400"}`}
                  onClick={() => setActiveTab("completed")}
              >
                Completed ({orders.filter(order => order.status === "Completed").length})
              </Button>
            </div>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {activeTab === "all" && "All Orders"}
                    {activeTab === "processing" && "Processing Orders"}
                    {activeTab === "completed" && "Completed Orders"}
                  </CardTitle>
                  <CardDescription>
                    {activeTab === "all" && `Complete list of warehouse orders (${filteredOrders.length} orders)`}
                    {activeTab === "processing" && `Orders currently being processed (${filteredOrders.length} orders)`}
                    {activeTab === "completed" && `Successfully completed orders (${filteredOrders.length} orders)`}
                  </CardDescription>
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
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Completed</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filteredOrders.map((order, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4 font-medium text-blue-600">{order.orderId}</td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{order.customer}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{order.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={order.status === "Completed"}
                                onChange={() => toggleOrderStatus(order.orderId)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                title={order.status === "Completed" ? "Mark as Processing" : "Mark as Completed"}
                            />
                          </div>
                        </td>
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

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPaymentModal(order)}
                                title="Manage Payments"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                    onClick={() => openEditModal(order)}
                                    className="cursor-pointer"
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Edit Order
                                </DropdownMenuItem>
                                
                                
                                <DropdownMenuItem
                                    onClick={() => deleteOrder(order.orderId, order.id)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Delete Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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