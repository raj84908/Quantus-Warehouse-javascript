"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, BarChart3, Database, Clock, Plus, Filter } from "lucide-react"
import { useState, useEffect } from 'react'

function ReportsPage() {
  const [timeRange, setTimeRange] = useState('30')
  const [activeCategory, setActiveCategory] = useState('Overview')
  const [reportsData, setReportsData] = useState(null)
  const [recentReports, setRecentReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReportsData()
  }, [timeRange])

  const fetchReportsData = async () => {
    setLoading(true)
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch(`/api/reports/stats?timeRange=${timeRange}`),
        fetch(`/api/reports/recent`)
      ])

      const statsText = await statsRes.text()
      const reportsText = await reportsRes.text()
      console.log('Stats raw =>', statsText)
      console.log('Reports raw =>', reportsText)

      const statsData = JSON.parse(statsText)
      const reportsListData = JSON.parse(reportsText)

      setReportsData(statsData)
      setRecentReports(reportsListData)
    } catch (error) {
      console.error('Failed to fetch reports data:', error)
    } finally {
      setLoading(false)
    }
  }


  const generateReport = async (type) => {
    setGenerating(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          timeRange,
          format: 'HTML' // Change to HTML since we're generating HTML files
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type.toLowerCase().replace(/\s+/g, '_')}_report_${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Refresh the reports list
        fetchReportsData()
      } else {
        // Log status and detailed server error message
        const errorText = await response.text()
        console.error('Failed to generate report:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGenerating(false)
    }
  }


  const downloadReport = async (reportId) => {
    try {
      const response = await fetch(`/api/reports/download/${reportId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report_${reportId}.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Less than an hour ago'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return '1 day ago'
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  const stats = reportsData ? [
    {
      title: "Total Reports",
      value: reportsData.totalReports?.toString() || "0",
      description: "All generated reports",
      icon: FileText,
    },
    {
      title: "Recent Activity",
      value: reportsData.automatedReports?.toString() || "0",
      description: "Reports this week",
      icon: Clock,
    },
    {
      title: "Storage Used",
      value: formatFileSize(reportsData.storageUsed || 0),
      description: "Total report storage",
      icon: Database,
    },
  ] : []

  const reportTypes = [
    { name: 'Inventory Summary', category: 'Inventory', description: 'Complete overview of current stock levels and values' },
    { name: 'Sales Performance', category: 'Sales', description: 'Sales analysis and revenue breakdown' },
    { name: 'Order Fulfillment', category: 'Operations', description: 'Order processing times and fulfillment metrics' },
    { name: 'Low Stock Alert', category: 'Inventory', description: 'Products requiring immediate attention' },
    { name: 'Financial Summary', category: 'Sales', description: 'Revenue and financial performance overview' }
  ]

  const reportCategories = [
    { name: "Overview", active: activeCategory === "Overview" },
    { name: "Inventory", active: activeCategory === "Inventory" },
    { name: "Sales", active: activeCategory === "Sales" },
    { name: "Operations", active: activeCategory === "Operations" },
  ]

  const filteredReports = activeCategory === 'Overview'
      ? recentReports
      : recentReports.filter(report => report.category === activeCategory)

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Generate and download warehouse reports</p>
            </div>
            <div className="flex space-x-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                      </CardContent>
                    </Card>
                )
              })}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Generate New Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {reportTypes.map((report, index) => (
                  <Card key={index} className="border-0 shadow-sm dark:bg-gray-800/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="mb-3">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">{report.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{report.description}</p>
                      </div>
                      <Button
                          onClick={() => generateReport(report.name)}
                          disabled={generating}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {generating ? 'Generating...' : 'Generate'}
                      </Button>
                    </CardContent>
                  </Card>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex space-x-1 border-b border-gray-100 dark:border-gray-700">
              {reportCategories.map((category, index) => (
                  <Button
                      key={index}
                      variant="ghost"
                      onClick={() => setActiveCategory(category.name)}
                      className={`rounded-none pb-3 ${category.active ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
                  >
                    {category.name}
                  </Button>
              ))}
            </div>
          </div>

          <Card className="border-0 shadow-sm dark:bg-gray-800/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                {activeCategory === 'Overview' ? 'Recent Reports' : `${activeCategory} Reports`}
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                {activeCategory === 'Overview' ? 'Recently generated warehouse reports' : `${activeCategory} reports from your warehouse`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {filteredReports.length > 0 ? filteredReports.map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm">{report.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                              {report.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(report.size)} • {formatDate(report.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadReport(report.id)}
                          className="ml-4 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                )) : (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No reports found</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Generate your first report to get started</p>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}

export default ReportsPage