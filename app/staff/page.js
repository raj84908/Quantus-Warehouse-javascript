import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Upload, Plus, Users, UserX, UserCheck, Star, Mail, Phone } from "lucide-react"

export default function StaffPage() {
  const stats = [
    {
      title: "Total Staff",
      value: "47",
      description: "Active employees",
      icon: Users,
    },
    {
      title: "On Leave",
      value: "3",
      description: "Currently on leave",
      icon: UserX,
      color: "text-orange-600",
    },
    {
      title: "New Hires",
      value: "5",
      description: "This month",
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      title: "Avg Performance",
      value: "4.2/5",
      description: "Overall rating",
      icon: Star,
    },
  ]

  const staff = [
    {
      id: "EMP-001",
      name: "John Smith",
      email: "john.smith@quantus.com",
      phone: "+1 (555) 123-4567",
      department: "Warehouse",
      position: "Warehouse Manager",
      status: "Active",
      hireDate: "Jan 15, 2022",
      performance: "Excellent",
      avatar: "J",
    },
    {
      id: "EMP-002",
      name: "Sarah Johnson",
      email: "sarah.johnson@quantus.com",
      phone: "+1 (555) 234-5678",
      department: "Operations",
      position: "Operations Supervisor",
      status: "Active",
      hireDate: "Mar 22, 2022",
      performance: "Good",
      avatar: "S",
    },
    {
      id: "EMP-003",
      name: "Mike Davis",
      email: "mike.davis@quantus.com",
      phone: "+1 (555) 345-6789",
      department: "Shipping",
      position: "Shipping Coordinator",
      status: "Active",
      hireDate: "Jun 10, 2023",
      performance: "Good",
      avatar: "M",
    },
    {
      id: "EMP-004",
      name: "Lisa Chen",
      email: "lisa.chen@quantus.com",
      phone: "+1 (555) 456-7890",
      department: "Quality Control",
      position: "QC Inspector",
      status: "On Leave",
      hireDate: "Sep 5, 2021",
      performance: "Excellent",
      avatar: "L",
    },
    {
      id: "EMP-005",
      name: "Tom Wilson",
      email: "tom.wilson@quantus.com",
      phone: "+1 (555) 567-8901",
      department: "Warehouse",
      position: "Picker/Packer",
      status: "Active",
      hireDate: "Nov 18, 2023",
      performance: "Average",
      avatar: "T",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
      case "On Leave":
        return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100"
      case "Inactive":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case "Excellent":
        return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
      case "Good":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
      case "Average":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
      case "Poor":
        return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Staff</h1>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
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
                <CardTitle className="dark:text-gray-100">Staff Directory</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Manage warehouse staff and employee information
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
                <Input placeholder="Search staff..." className="pl-10 dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-48 dark:bg-gray-700 dark:text-gray-100">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                  <SelectItem value="quality">Quality Control</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Position</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Hire Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Performance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((employee, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center dark:bg-gray-700">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {employee.avatar}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{employee.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{employee.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                            <Mail className="mr-1 h-3 w-3" />
                            {employee.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            {employee.phone}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{employee.department}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{employee.position}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(employee.status)}>{employee.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{employee.hireDate}</td>
                      <td className="py-3 px-4">
                        <Badge className={getPerformanceColor(employee.performance)}>{employee.performance}</Badge>
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
