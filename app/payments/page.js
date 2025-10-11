"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DollarSign,
  Download,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt
} from "lucide-react"
import { useState, useEffect } from 'react'

function PaymentsPage() {
  const [timeRange, setTimeRange] = useState('365')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRows, setSelectedRows] = useState([])
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null)
  const [partialPayments, setPartialPayments] = useState([])
  const [newPartialPaymentAmount, setNewPartialPaymentAmount] = useState("")
  const [newPaymentMethod, setNewPaymentMethod] = useState("Cash")
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [newPaymentNotes, setNewPaymentNotes] = useState("")

  useEffect(() => {
    fetchPaymentsData()
  }, [timeRange])

  const fetchPaymentsData = async () => {
    setLoading(true)
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        fetch(`/api/payments/stats?timeRange=${timeRange}`),
        fetch(`/api/payments/list?timeRange=${timeRange}`)
      ])

      const statsData = await statsRes.json()
      const paymentsData = await paymentsRes.json()

      setStats(statsData)
      setPayments(Array.isArray(paymentsData) ? paymentsData : [])
    } catch (error) {
      console.error('Failed to fetch payments data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      paid: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900",
      partial: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-900",
      overdue: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900",
      pending: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900"
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${styles[status.toLowerCase()] || styles.pending}`}>
        {status}
      </span>
    )
  }

  const handleRowSelect = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedRows.length === filteredPayments.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredPayments.map(p => p.id))
    }
  }

  const openPaymentModal = async (payment) => {
    setSelectedOrderForPayment(payment)
    setIsPaymentModalOpen(true)
    await fetchPartialPayments(payment.id)
  }

  const fetchPartialPayments = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/partial-payments`)
      if (response.ok) {
        const paymentsData = await response.json()
        setPartialPayments(paymentsData)
      }
    } catch (error) {
      console.error('Error fetching partial payments:', error)
    }
  }

  const handleAddPartialPayment = async () => {
    if (!newPartialPaymentAmount || parseFloat(newPartialPaymentAmount) <= 0) {
      alert("Please enter a valid payment amount")
      return
    }

    if (!selectedOrderForPayment) {
      alert("No order selected")
      return
    }

    const amount = parseFloat(newPartialPaymentAmount)
    const totalPaid = partialPayments.reduce((sum, p) => sum + p.amount, 0)
    const balanceDue = selectedOrderForPayment.total - totalPaid

    if (amount > balanceDue) {
      alert(`Payment amount ($${amount.toFixed(2)}) exceeds balance due ($${balanceDue.toFixed(2)})`)
      return
    }

    try {
      const response = await fetch(`/api/orders/${selectedOrderForPayment.id}/partial-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          paymentMethod: newPaymentMethod,
          paymentDate: new Date(newPaymentDate).toISOString(),
          notes: newPaymentNotes || null
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add payment')
      }

      const payment = await response.json()
      setPartialPayments([payment, ...partialPayments])

      // Reset form
      setNewPartialPaymentAmount("")
      setNewPaymentMethod("Cash")
      setNewPaymentDate(new Date().toISOString().split('T')[0])
      setNewPaymentNotes("")

      // Refresh the payments list
      await fetchPaymentsData()

      alert("Payment recorded successfully!")
    } catch (error) {
      console.error('Error adding partial payment:', error)
      alert(`Failed to record payment: ${error.message}`)
    }
  }

  const calculateBalanceDue = (order, paymentsArray) => {
    const totalPaid = paymentsArray.reduce((sum, p) => sum + p.amount, 0)
    return order.total - totalPaid
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchQuery === '' ||
      payment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || payment.status.toLowerCase() === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading payments...</p>
        </div>
      </div>
    )
  }

  const summaryCards = [
    {
      title: "Unpaid",
      value: formatCurrency(stats?.unpaid || 0),
      description: `Last ${timeRange} days`,
      icon: AlertCircle,
      color: "orange"
    },
    {
      title: "Partial Payments",
      value: formatCurrency(stats?.partial || 0),
      description: `${stats?.partialCount || 0} invoices`,
      icon: Clock,
      color: "blue"
    },
    {
      title: "Paid",
      value: formatCurrency(stats?.paid || 0),
      description: `Last ${timeRange} days`,
      icon: CheckCircle2,
      color: "green"
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.total || 0),
      description: "All transactions",
      icon: DollarSign,
      color: "purple"
    }
  ]

  const colorClasses = {
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments & Invoices</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Track payments, partial payments, and outstanding balances</p>
          </div>
          <div className="flex space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800">
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 365 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card, index) => {
            const Icon = card.icon
            return (
              <Card key={index} className="border-0 shadow-sm dark:bg-gray-800/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${colorClasses[card.color]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                    {card.value}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm dark:bg-gray-800/50 mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer or invoice number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              {selectedRows.length > 0 && (
                <Button variant="outline" className="border-gray-200 dark:border-gray-700">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Batch Actions ({selectedRows.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="border-0 shadow-sm dark:bg-gray-800/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              Payment Transactions
            </CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              {filteredPayments.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={selectedRows.length === filteredPayments.length && filteredPayments.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paid</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length > 0 ? filteredPayments.map((payment, index) => (
                    <tr
                      key={payment.id}
                      className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <Checkbox
                          checked={selectedRows.includes(payment.id)}
                          onCheckedChange={() => handleRowSelect(payment.id)}
                        />
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(payment.date)}
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {payment.orderId}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100">
                        {payment.customer}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(payment.dueDate)}
                      </td>
                      <td className="py-4 px-4 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.total)}
                      </td>
                      <td className="py-4 px-4 text-sm text-right text-green-600 dark:text-green-400">
                        {formatCurrency(payment.paid)}
                      </td>
                      <td className="py-4 px-4 text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.balance)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {payment.status.toLowerCase() !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentModal(payment)}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                          >
                            Receive Payment
                          </Button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="10" className="py-12 text-center">
                        <Receipt className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No payments found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Modal */}
        {isPaymentModalOpen && selectedOrderForPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Payments</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsPaymentModalOpen(false)
                      setPartialPayments([])
                      setNewPartialPaymentAmount("")
                      setNewPaymentMethod("Cash")
                      setNewPaymentDate(new Date().toISOString().split('T')[0])
                      setNewPaymentNotes("")
                    }}
                  >
                    <Receipt className="h-4 w-4" />
                  </Button>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">{selectedOrderForPayment.orderId}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrderForPayment.customer}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Order Total:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(selectedOrderForPayment.total)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span className="font-medium">Total Paid:</span>
                      <span className="font-bold">
                        {formatCurrency(partialPayments.reduce((sum, p) => sum + p.amount, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-400 text-lg pt-2 border-t border-gray-200 dark:border-gray-600">
                      <span className="font-bold">Balance Due:</span>
                      <span className="font-bold">
                        {formatCurrency(calculateBalanceDue(selectedOrderForPayment, partialPayments))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add Payment Form */}
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Record New Payment</label>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Amount *</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newPartialPaymentAmount}
                        onChange={(e) => setNewPartialPaymentAmount(e.target.value)}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Payment Method *</label>
                      <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                        <SelectTrigger className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectItem value="Cash" className="text-gray-900 dark:text-gray-100">Cash</SelectItem>
                          <SelectItem value="Credit Card" className="text-gray-900 dark:text-gray-100">Credit Card</SelectItem>
                          <SelectItem value="Debit Card" className="text-gray-900 dark:text-gray-100">Debit Card</SelectItem>
                          <SelectItem value="Check" className="text-gray-900 dark:text-gray-100">Check</SelectItem>
                          <SelectItem value="Bank Transfer" className="text-gray-900 dark:text-gray-100">Bank Transfer</SelectItem>
                          <SelectItem value="PayPal" className="text-gray-900 dark:text-gray-100">PayPal</SelectItem>
                          <SelectItem value="Venmo" className="text-gray-900 dark:text-gray-100">Venmo</SelectItem>
                          <SelectItem value="Zelle" className="text-gray-900 dark:text-gray-100">Zelle</SelectItem>
                          <SelectItem value="Other" className="text-gray-900 dark:text-gray-100">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Payment Date *</label>
                    <Input
                      type="date"
                      value={newPaymentDate}
                      onChange={(e) => setNewPaymentDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                    <textarea
                      placeholder="Add any notes about this payment..."
                      value={newPaymentNotes}
                      onChange={(e) => setNewPaymentNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>

                  <Button onClick={handleAddPartialPayment} className="w-full bg-blue-600 hover:bg-blue-700">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                </div>

                {/* Payment History */}
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Payment History</h3>
                  {partialPayments.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No payments recorded yet</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {partialPayments.map((payment) => (
                        <div key={payment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(payment.amount)}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300">
                                  {payment.paymentMethod || 'Cash'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                <div className="flex items-center">
                                  <span className="font-medium mr-2">Payment Date:</span>
                                  <span>{new Date(payment.paymentDate || payment.paidAt).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium mr-2">Recorded:</span>
                                  <span className="text-xs">
                                    {new Date(payment.paidAt).toLocaleDateString()} at {new Date(payment.paidAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                {payment.notes && (
                                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs italic">
                                    <span className="font-medium">Note:</span> {payment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
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
      </div>
    </div>
  )
}

export default PaymentsPage
