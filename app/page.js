import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, DollarSign, AlertTriangle } from "lucide-react"

async function getProducts() {
  const res = await fetch('http://localhost:4000/api/products', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export default function Dashboard() {
  const stats = [
    {
      title: "Total Items",
      value: "12,847",
      change: "+2.5%",
      changeText: "from last month",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Low Stock Items",
      value: "23",
      change: "+3 items",
      changeText: "need restocking",
      icon: AlertTriangle,
      color: "text-orange-600",
    },
    {
      title: "Orders Today",
      value: "156",
      change: "+12%",
      changeText: "from yesterday",
      icon: ShoppingCart,
      color: "text-green-600",
    },
    {
      title: "Warehouse Value",
      value: "$2.4M",
      change: "-1.2%",
      changeText: "from last month",
      icon: DollarSign,
      color: "text-purple-600",
    },
  ]

  const recentActivity = [
    {
      type: "stock",
      title: "Stock replenished",
      description: "Widget A - 500 units added",
      time: "2m ago",
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      icon: "●",
    },
    {
      type: "order",
      title: "Order fulfilled",
      description: "Order #12847 - 25 items shipped",
      time: "15m ago",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      icon: "●",
    },
    {
      type: "alert",
      title: "Low stock alert",
      description: "Component B - Only 12 units remaining",
      time: "1h ago",
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      icon: "●",
    },
    {
      type: "product",
      title: "New product added",
      description: "Premium Widget X - 100 units",
      time: "3h ago",
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      icon: "●",
    },
  ]

  const topProducts = [
    {
      name: "Widget Pro A",
      sku: "WPA-001",
      units: "847 units",
      change: "+15%",
      avatar: "W",
    },
    {
      name: "Component X",
      sku: "CX-205",
      units: "623 units",
      change: "+8%",
      avatar: "C",
    },
    {
      name: "Premium Kit",
      sku: "PK-150",
      units: "445 units",
      change: "-3%",
      avatar: "P",
    },
  ]

  const recentOrders = [
    {
      orderId: "#ORD-12847",
      customer: "Acme Corp",
      items: "25 items",
      status: "Processing",
      priority: "High",
      date: "Dec 27, 2024",
    },
    {
      orderId: "#ORD-12846",
      customer: "TechStart Inc",
      items: "12 items",
      status: "Ready to Ship",
      priority: "Medium",
      date: "Dec 27, 2024",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span
                      className={
                        stat.change.startsWith("+")
                          ? "text-green-600 dark:text-green-400"
                          : stat.change.startsWith("-")
                            ? "text-red-600 dark:text-red-400"
                            : "text-orange-600 dark:text-orange-400"
                      }
                    >
                      {stat.change}
                    </span>{" "}
                    {stat.changeText}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest inventory movements and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${activity.color.split(" ")[0]} ${activity.color.split(" ")[1]} dark:${activity.color.split(" ")[3]} dark:${activity.color.split(" ")[4]}`}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Moving Products</CardTitle>
              <CardDescription>Most frequently ordered items this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">{product.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{product.units}</p>
                      <p
                        className={`text-xs ${product.change.startsWith("+") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {product.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Items</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Priority</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium text-primary">{order.orderId}</td>
                      <td className="py-3 px-4 text-foreground">{order.customer}</td>
                      <td className="py-3 px-4 text-muted-foreground">{order.items}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            order.status === "Processing"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          }
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            order.priority === "High"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          }
                        >
                          {order.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{order.date}</td>
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
