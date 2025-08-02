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
} from "lucide-react"

export default function OrdersPage() {
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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </div>
        </div>

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
