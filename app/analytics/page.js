import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, ShoppingCart, RotateCcw, Users, BarChart3, Package, Truck } from "lucide-react"

export default function AnalyticsPage() {
  const stats = [
    {
      title: "Revenue",
      value: "$124,573",
      change: "+12.5%",
      changeText: "from last month",
      icon: DollarSign,
    },
    {
      title: "Orders Processed",
      value: "1,247",
      change: "+8.2%",
      changeText: "from last month",
      icon: ShoppingCart,
    },
    {
      title: "Inventory Turnover",
      value: "4.2x",
      change: "-2.1%",
      changeText: "from last month",
      icon: RotateCcw,
      changeColor: "text-red-600",
    },
    {
      title: "Customer Satisfaction",
      value: "94.2%",
      change: "+1.8%",
      changeText: "from last month",
      icon: Users,
    },
  ]

  const topProducts = [
    {
      name: "Widget Pro A",
      units: "847 units sold",
      change: "+15%",
    },
    {
      name: "Component X",
      units: "623 units sold",
      change: "+8%",
    },
    {
      name: "Premium Kit",
      units: "445 units sold",
      change: "-3%",
    },
  ]

  const performanceMetrics = [
    {
      metric: "Order Fulfillment Time",
      value: "2.3 days",
      target: "2.0 days",
      icon: Truck,
    },
    {
      metric: "Inventory Accuracy",
      value: "99.2%",
      target: "99.0%",
      icon: Package,
    },
    {
      metric: "Shipping Accuracy",
      value: "98.7%",
      target: "98.0%",
      icon: Truck,
    },
  ]

  const insights = [
    {
      type: "Stock Alert",
      message: "Low stock detected for 23 items",
      severity: "warning",
    },
    {
      type: "Performance",
      message: "Order fulfillment improved by 15%",
      severity: "success",
    },
    {
      type: "Trend",
      message: "Electronics category showing strong growth",
      severity: "info",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Track your warehouse performance and trends</p>
          </div>
          <Select defaultValue="30">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Analytics Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span
                        className={
                          stat.changeColor || (stat.change.startsWith("+") ? "text-green-600" : "text-red-600")
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Sales Trend</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Monthly revenue over the past year
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Sales trend chart would be displayed here</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Integration with charting library needed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Inventory Movement</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Stock levels and movement patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Inventory movement chart would be displayed here</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Integration with charting library needed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Top Products</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Best performing items this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{product.units}</p>
                    </div>
                    <span
                      className={`text-sm font-medium ${product.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                    >
                      {product.change}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Performance Metrics</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Key operational indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map((metric, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {metric.icon ? <metric.icon className="h-4 w-4 mr-1 inline-block" /> : null}
                        {metric.metric}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{metric.value}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Target: {metric.target}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Insights & Alerts</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Important notifications and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        insight.severity === "warning"
                          ? "bg-orange-500"
                          : insight.severity === "success"
                            ? "bg-green-500"
                            : "bg-blue-500"
                      }`}
                    ></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">● {insight.type}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{insight.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
