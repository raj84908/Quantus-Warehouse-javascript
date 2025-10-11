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
  AlertTriangle,
  TrendingUp,
  Activity,
  Maximize2,
  Minimize2,
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { useState, useEffect } from "react"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30")
  const [analytics, setAnalytics] = useState(null)
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
      const [analyticsRes, insightsRes, salesTrendRes] = await Promise.all([
        fetch(`/api/analytics?timeRange=${timeRange}`),
        fetch(`/api/analytics/insights`),
        fetch(`/api/analytics/sales-trend?timeRange=${timeRange}`),
      ])

      const [analyticsData, insightsData, salesTrendData] = await Promise.all([
        analyticsRes.json(),
        insightsRes.json(),
        salesTrendRes.json(),
      ])

      setAnalytics(analyticsData)
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

          {/* Overview cards - cleaner design */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <Card key={index} className="border-0 shadow-sm dark:bg-gray-800/50">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">{stat.value}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.title}</p>
                      </CardContent>
                    </Card>
                )
              })}
            </div>
          </div>

          {/* Sales Trend Chart with cleaner styling */}
          <div className={`mb-6 ${isChartExpanded ? "fixed inset-4 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl" : ""}`}>
            <Card className="border-0 shadow-sm dark:bg-gray-800/50">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Sales Trend
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                    Revenue performance over time
                  </CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChartExpanded(!isChartExpanded)}
                    className="ml-auto hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isChartExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`${isChartExpanded ? "h-96" : "h-80"} w-full`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesTrend} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} className="dark:stroke-gray-600" />
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
                          strokeWidth={2}
                          fill="url(#salesGradient)"
                          fillOpacity={1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Cleaner summary metrics below chart */}
                <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Peak Revenue</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {salesTrend.length > 0 ? formatCurrency(Math.max(...salesTrend.map((d) => d.revenue))) : "$0"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average Daily</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {salesTrend.length > 0
                          ? formatCurrency(salesTrend.reduce((sum, d) => sum + d.revenue, 0) / salesTrend.length)
                          : "$0"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Revenue</div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {salesTrend.length > 0 ? formatCurrency(salesTrend.reduce((sum, d) => sum + d.revenue, 0)) : "$0"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights & Alerts - cleaner single column layout */}
          <Card className="border-0 shadow-sm dark:bg-gray-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-blue-600" />
                Insights & Alerts
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                Important notifications and trends
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {insights.length > 0 ? (
                    insights.map((insight, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                          <div className="mt-0.5">{getSeverityIcon(insight.severity)}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{insight.type}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{insight.message}</p>
                          </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No insights available</p>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
