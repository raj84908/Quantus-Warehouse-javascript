"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  ShoppingCart,
  RotateCcw,
  Users,
  BarChart3,
  Package,
  Truck,
  AlertTriangle,
  TrendingUp,
  Activity,
  Maximize2,
  Minimize2,
} from "lucide-react"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart,
} from "recharts"
import { useState, useEffect } from "react"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30")
  const [analytics, setAnalytics] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState([])
  const [insights, setInsights] = useState([])
  const [salesTrend, setSalesTrend] = useState([])
  const [loading, setLoading] = useState(true)
  const [isChartExpanded, setIsChartExpanded] = useState(false)

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])
  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const [analyticsRes, topProductsRes, performanceRes, insightsRes, salesTrendRes] = await Promise.all([
        fetch(`/api/analytics?timeRange=${timeRange}`),
        fetch(`/api/analytics/top-products?timeRange=${timeRange}`),
        fetch(`/api/analytics/performance?timeRange=${timeRange}`),
        fetch(`/api/analytics/insights`),
        fetch(`/api/analytics/sales-trend?timeRange=${timeRange}`),
      ])

      const [analyticsData, topProductsData, performanceData, insightsData, salesTrendData] = await Promise.all([
        analyticsRes.json(),
        topProductsRes.json(),
        performanceRes.json(),
        insightsRes.json(),
        salesTrendRes.json(),
      ])

      setAnalytics(analyticsData)
      setTopProducts(Array.isArray(topProductsData) ? topProductsData : [])
      setPerformanceMetrics(Array.isArray(performanceData) ? performanceData : [])
      setInsights(Array.isArray(insightsData) ? insightsData : [])
      setSalesTrend(Array.isArray(salesTrendData) ? salesTrendData : [])
    } catch (error) {
      console.error("Failed to fetch analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatCompactCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return formatCurrency(value)
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "success":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "info":
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  // Calculate Y-axis domain with proper scaling
  const getYAxisDomain = (data) => {
    if (!Array.isArray(data) || data.length === 0) return [0, 100]
    const values = data.map((d) => d.revenue).filter((v) => v != null)
    if (values.length === 0) return [0, 100]
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 // 10% padding
    return [Math.max(0, min - padding), max + padding]
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {new Date(label + 'T12:00:00').toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Revenue: <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
            </p>
          </div>
      )
    }
    return null
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
          </div>
        </div>
    )
  }

  // Stats cards: REMOVED percent change and "from last period"
  const stats = [
    {
      title: "Revenue",
      value: formatCurrency(analytics?.revenue?.value || 0),
      icon: DollarSign,
    },
    {
      title: "Orders Processed",
      value: analytics?.orders?.value?.toString() || "0",
      icon: ShoppingCart,
    },
    {
      title: "Inventory Activity",
      value: `${analytics?.inventoryTurnover?.value?.toFixed(1) || 0}x`,
      icon: RotateCcw,
    },
    {
      title: "Order Completion Rate",
      value: `${analytics?.customerSatisfaction?.value?.toFixed(1) || 0}%`,
      icon: Users,
    },
  ]

  const yAxisDomain = getYAxisDomain(salesTrend)

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Track your warehouse performance and trends</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overview cards - NO percentages */}
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
                        <p className="text-xs text-gray-600 dark:text-gray-400">&nbsp;</p>
                      </CardContent>
                    </Card>
                )
              })}
            </div>
          </div>

          {/* Sales Trend Chart and only three summary metrics */}
          <div className={`mb-8 ${isChartExpanded ? "fixed inset-4 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl" : ""}`}>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Sales Trend
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Revenue performance over time with detailed insights
                  </CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChartExpanded(!isChartExpanded)}
                    className="ml-auto"
                >
                  {isChartExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                <div className={`${isChartExpanded ? "h-96" : "h-80"} w-full`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} className="dark:stroke-gray-600" />
                      <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
                          tickLine={{ stroke: "#d1d5db" }}
                          tickFormatter={(value) => {
                            const date = new Date(value + 'T12:00:00')
                            return timeRange === "7"
                                ? date.toLocaleDateString("en-US", { weekday: "short" })
                                : date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          }}
                      />
                      <YAxis
                          domain={yAxisDomain}
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                          axisLine={{ stroke: "#d1d5db", strokeWidth: 1 }}
                          tickLine={{ stroke: "#d1d5db" }}
                          tickFormatter={formatCompactCurrency}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          fill="url(#salesGradient)"
                          fillOpacity={1}
                      />
                      <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#1d4ed8"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: "#1d4ed8", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Only three summary metrics below chart */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {salesTrend.length > 0 ? formatCurrency(Math.max(...salesTrend.map((d) => d.revenue))) : "$0"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Peak Revenue</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {salesTrend.length > 0
                          ? formatCurrency(salesTrend.reduce((sum, d) => sum + d.revenue, 0) / salesTrend.length)
                          : "$0"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Average Daily</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {salesTrend.length > 0 ? formatCurrency(salesTrend.reduce((sum, d) => sum + d.revenue, 0)) : "$0"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products Performance, with "Estimated Revenue" and "Avg. Growth" REMOVED */}
          <div className="mb-8">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Top Products Performance
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Comprehensive analysis of best-selling products with revenue and trend insights
                  </CardDescription>
                </div>
                <Select defaultValue="units">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="units">By Units</SelectItem>
                    <SelectItem value="revenue">By Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={topProducts.slice(0, 6).map((product) => ({
                          name: product.name.length > 12 ? product.name.substring(0, 12) + "..." : product.name,
                          fullName: product.name,
                          units: Number.parseInt(product.units.split(" ")[0]),
                          revenue: product.revenue,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                      />
                      <YAxis
                          yAxisId="units"
                          orientation="left"
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          label={{ value: "Units Sold", angle: -90, position: "insideLeft" }}
                      />
                      <YAxis
                          yAxisId="revenue"
                          orientation="right"
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          tickFormatter={formatCompactCurrency}
                          label={{ value: "Revenue", angle: 90, position: "insideRight" }}
                      />
                      <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                  <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{data.fullName}</p>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                      Units: <span className="font-semibold">{data.units.toLocaleString()}</span>
                                    </p>
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                      Revenue: <span className="font-semibold">{formatCurrency(data.revenue)}</span>
                                    </p>
                                  </div>
                              )
                            }
                            return null
                          }}
                      />
                      <Bar yAxisId="units" dataKey="units" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Units Sold" />
                      <Bar
                          yAxisId="revenue"
                          dataKey="revenue"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          name="Revenue"
                          opacity={0.7}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Keep only "Total Units" card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Units</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {topProducts
                          .reduce((sum, product) => sum + Number.parseInt(product.units.split(" ")[0]), 0)
                          .toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Top 8 products combined</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product/Performance/Insights panels unchanged */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Top Products</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Best performing items this period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.units}</p>
                        </div>
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
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        <Truck className="h-4 w-4 mr-1" />
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
                  {insights.length > 0 ? (
                      insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="mt-1">{getSeverityIcon(insight.severity)}</div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{insight.type}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{insight.message}</p>
                            </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-4">
                        <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No insights available</p>
                      </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}
