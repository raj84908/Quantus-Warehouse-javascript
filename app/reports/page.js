import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, BarChart3, Database, Clock } from "lucide-react"

function ReportsPage() {
  const stats = [
    {
      title: "Total Reports",
      value: "247",
      description: "Generated this month",
      icon: FileText,
    },
    {
      title: "Automated Reports",
      value: "12",
      description: "Scheduled reports",
      icon: Clock,
    },
    {
      title: "Data Accuracy",
      value: "99.2%",
      description: "Report accuracy rate",
      icon: BarChart3,
    },
    {
      title: "Storage Used",
      value: "2.4 GB",
      description: "Report storage",
      icon: Database,
    },
  ]

  const recentReports = [
    {
      name: "Inventory Summary",
      description: "Complete overview of current stock levels and values",
      category: "Inventory",
      format: "PDF",
      size: "2.4 MB",
      generated: "2 hours ago",
    },
    {
      name: "Sales Performance",
      description: "Monthly sales analysis and revenue breakdown",
      category: "Sales",
      format: "Excel",
      size: "1.8 MB",
      generated: "1 day ago",
    },
    {
      name: "Order Fulfillment",
      description: "Order processing times and fulfillment metrics",
      category: "Operations",
      format: "PDF",
      size: "1.2 MB",
      generated: "3 hours ago",
    },
    {
      name: "Staff Productivity",
      description: "Employee performance and productivity analysis",
      category: "HR",
      format: "Excel",
      size: "956 KB",
      generated: "5 hours ago",
    },
  ]

  const reportCategories = [
    { name: "Overview", active: true },
    { name: "Inventory", active: false },
    { name: "Sales", active: false },
    { name: "Operations", active: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Generate and download warehouse reports</p>
          </div>
          <div className="flex space-x-3">
            <Select defaultValue="30">
              <SelectTrigger className="w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">Generate Report</Button>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Reports & Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{stat.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
            {reportCategories.map((category, index) => (
              <Button
                key={index}
                variant="ghost"
                className={category.active ? "border-b-2 border-blue-500 text-blue-500" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Recent Reports</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Recently generated warehouse reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{report.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{report.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {report.category}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {report.format} • {report.size} • {report.generated}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ReportsPage