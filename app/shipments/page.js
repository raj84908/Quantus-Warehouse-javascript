import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Plus, Truck, Clock, CheckCircle, BarChart3 } from "lucide-react"

export default function ShipmentsPage() {
  const stats = [
    {
      title: "Total Shipments",
      value: "847",
      description: "This month",
      icon: Truck,
    },
    {
      title: "In Transit",
      value: "34",
      description: "Currently shipping",
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Delivered Today",
      value: "12",
      description: "Successful deliveries",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "On-Time Rate",
      value: "94.2%",
      description: "Delivery performance",
      icon: BarChart3,
    },
  ]

  const shipments = [
    {
      shipmentId: "SHP-001247",
      orderId: "ORD-12847",
      customer: "Acme Corp",
      destination: "New York, NY",
      carrier: "FedEx",
      trackingNumber: "123456789123",
      status: "In Transit",
      items: "25 items",
      weight: "45.2 lbs",
      estDelivery: "Dec 29, 2024",
    },
    {
      shipmentId: "SHP-001246",
      orderId: "ORD-12846",
      customer: "TechStart Inc",
      destination: "San Francisco, CA",
      carrier: "UPS",
      trackingNumber: "987654321987",
      status: "Delivered",
      items: "12 items",
      weight: "23.8 lbs",
      estDelivery: "Dec 28, 2024",
    },
    {
      shipmentId: "SHP-001245",
      orderId: "ORD-12845",
      customer: "Global Solutions",
      destination: "Chicago, IL",
      carrier: "DHL",
      trackingNumber: "555666777778",
      status: "Preparing",
      items: "8 items",
      weight: "12.5 lbs",
      estDelivery: "Dec 30, 2024",
    },
    {
      shipmentId: "SHP-001244",
      orderId: "ORD-12844",
      customer: "Innovation Labs",
      destination: "Austin, TX",
      carrier: "FedEx",
      trackingNumber: "111222333334",
      status: "Out for Delivery",
      items: "45 items",
      weight: "78.9 lbs",
      estDelivery: "Dec 27, 2024",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "In Transit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Preparing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "Out for Delivery":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Shipments</h1>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Shipment
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color || "text-blue-600"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color || ""}`}>{stat.value}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="dark:text-gray-100">Shipments</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Track and manage all warehouse shipments
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
                <Input placeholder="Search shipments..." className="pl-10 dark:bg-gray-700 dark:text-gray-50" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-48 dark:bg-gray-700 dark:text-gray-50">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Shipment ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Destination</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Carrier</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Tracking Number
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Items</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Weight</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Est. Delivery</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{shipment.shipmentId}</td>
                      <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">{shipment.orderId}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{shipment.customer}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        Destination: {shipment.destination}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.carrier}</td>
                      <td className="py-3 px-4 font-mono text-sm text-blue-600 dark:text-blue-400">
                        {shipment.trackingNumber}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.items}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.weight}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        Delivery Date: {shipment.estDelivery}
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline">
                          •••
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
