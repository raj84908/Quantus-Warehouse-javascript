
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, ShoppingCart, RotateCcw, Users, BarChart3, Package, Truck, AlertTriangle, TrendingUp, Activity } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useState, useEffect } from 'react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30')
  const [analytics, setAnalytics] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [performanceMetrics, setPerformanceMetrics] = useState([])
  const [insights, setInsights] = useState([])
  const [salesTrend, setSalesTrend] = useState([])
  const [loading, setLoading] = useState(true)

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
        fetch(`/api/analytics/sales-trend?timeRange=${timeRange}`)
      ])

      const [analyticsData, topProductsData, performanceData, insightsData, salesTrendData] = await Promise.all([
        analyticsRes.json(),
        topProductsRes.json(),
        performanceRes.json(),
        insightsRes.json(),
        salesTrendRes.json()
      ])

      setAnalytics(analyticsData)
      setTopProducts(topProductsData)
      setPerformanceMetrics(performanceData)
      setInsights(insightsData)
      setSalesTrend(salesTrendData)
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'success':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'info':
        return <Activity className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-blue-500" />
    }
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

  const stats = [
    {
      title: "Revenue",
      value: formatCurrency(analytics?.revenue?.value || 0),
      change: formatPercentage(analytics?.revenue?.change || 0),
      changeText: "from last period",
      icon: DollarSign,
    },
    {
      title: "Orders Processed",
      value: analytics?.orders?.value?.toString() || "0",
      change: formatPercentage(analytics?.orders?.change || 0),
      changeText: "from last period",
      icon: ShoppingCart,
    },
    {
      title: "Inventory Activity",
      value: `${analytics?.inventoryTurnover?.value?.toFixed(1) || 0}x`,
      change: formatPercentage(analytics?.inventoryTurnover?.change || 0),
      changeText: "from last period",
      icon: RotateCcw,
      changeColor: analytics?.inventoryTurnover?.change < 0 ? "text-red-600" : undefined,
    },
    {
      title: "Order Completion Rate",
      value: `${analytics?.customerSatisfaction?.value?.toFixed(1) || 0}%`,
      change: formatPercentage(analytics?.customerSatisfaction?.change || 0),
      changeText: "from last period",
      icon: Users,
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
                  Daily revenue over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip
                          formatter={(value) => [formatCurrency(value), 'Revenue']}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Top Products Performance</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Best-selling products by quantity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts.slice(0, 5).map(product => ({
                      name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
                      units: parseInt(product.units.split(' ')[0])
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="units" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

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
                  {insights.length > 0 ? insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getSeverityIcon(insight.severity)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{insight.type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{insight.message}</p>
                        </div>
                      </div>
                  )) : (
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