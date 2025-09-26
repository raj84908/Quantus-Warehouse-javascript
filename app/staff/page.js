"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Download, Upload, Plus, Users, UserX, UserCheck, Star, Mail, Phone, Edit, Trash2, Eye, Building2, UserCircle } from "lucide-react"

const API_BASE = 'http://localhost:4000'

export default function StaffPage() {
  // State management
  const [activeTab, setActiveTab] = useState("staff")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    status: "Active",
    hireDate: "",
    performance: "Good",
    type: "staff",
    company: "",
    address: "",
    notes: ""
  })

  useEffect(() => {
    loadPeople()
  }, [])

  const loadPeople = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/people`)
      if (response.ok) {
        const data = await response.json()
        setPeople(data)
      } else {
        console.error('Failed to load people:', response.status)
      }
    } catch (error) {
      console.error('Error loading people:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPeople = people.filter(person => {
    const matchesTab = activeTab === "all" || person.type === activeTab
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || person.department === selectedDepartment
    const matchesStatus = selectedStatus === "all" || person.status === selectedStatus

    return matchesTab && matchesSearch && matchesDepartment && matchesStatus
  })

  const stats = {
    staff: {
      total: people.filter(p => p.type === 'staff').length,
      onLeave: people.filter(p => p.type === 'staff' && p.status === 'On Leave').length,
      newHires: people.filter(p => p.type === 'staff' && p.hireDate && new Date(p.hireDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      avgPerformance: calculateAveragePerformance()
    },
    customers: {
      total: people.filter(p => p.type === 'customer').length,
      active: people.filter(p => p.type === 'customer' && p.status === 'Active').length,
      inactive: people.filter(p => p.type === 'customer' && p.status === 'Inactive').length
    }
  }

  function calculateAveragePerformance() {
    const staffWithPerformance = people.filter(p => p.type === 'staff' && p.performance)
    if (staffWithPerformance.length === 0) return "0.0"

    const performanceValues = { 'Excellent': 5, 'Good': 4, 'Average': 3, 'Poor': 2 }
    const total = staffWithPerformance.reduce((sum, person) => {
      return sum + (performanceValues[person.performance] || 0)
    }, 0)

    return (total / staffWithPerformance.length).toFixed(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingPerson ? `${API_BASE}/api/people/${editingPerson.id}` : `${API_BASE}/api/people`
      const method = editingPerson ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadPeople()
        resetForm()
        setDialogOpen(false)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Error saving person')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving person')
    }
  }

  const handleEdit = (person) => {
    setEditingPerson(person)
    const formattedHireDate = person.hireDate ? person.hireDate.split('T')[0] : ''
    setFormData({
      ...person,
      hireDate: formattedHireDate
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      try {
        const response = await fetch(`${API_BASE}/api/people/${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          await loadPeople()
        } else {
          const errorData = await response.json()
          alert(errorData.error || 'Error deleting person')
        }
      } catch (error) {
        console.error('Error deleting person:', error)
        alert('Error deleting person')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      department: "",
      position: "",
      status: "Active",
      hireDate: "",
      performance: "Good",
      type: activeTab === "customer" ? "customer" : "staff",
      company: "",
      address: "",
      notes: ""
    })
    setEditingPerson(null)
  }

  const exportData = () => {
    const dataToExport = filteredPeople.map(person => ({
      ...person,
      id: undefined
    }))

    const dataStr = JSON.stringify(dataToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })

    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeTab}_data_${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
      case "On Leave": return "bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100"
      case "Inactive": return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case "Excellent": return "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
      case "Good": return "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
      case "Average": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
      case "Poor": return "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
    }
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                People Directory
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage staff and customer information
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={exportData}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add {activeTab === 'customer' ? 'Customer' : 'Employee'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingPerson ? 'Edit' : 'Add'} {formData.type === 'customer' ? 'Customer' : 'Employee'}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Name *</Label>
                          <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              required
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Select
                              value={formData.type}
                              onValueChange={(value) => setFormData({...formData, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="customer">Customer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      {formData.type === 'staff' ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="department">Department</Label>
                                <Input
                                    id="department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="position">Position</Label>
                                <Input
                                    id="position"
                                    value={formData.position}
                                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="hireDate">Hire Date</Label>
                                <Input
                                    id="hireDate"
                                    type="date"
                                    value={formData.hireDate}
                                    onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({...formData, status: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="On Leave">On Leave</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="performance">Performance</Label>
                                <Select
                                    value={formData.performance}
                                    onValueChange={(value) => setFormData({...formData, performance: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Excellent">Excellent</SelectItem>
                                    <SelectItem value="Good">Good</SelectItem>
                                    <SelectItem value="Average">Average</SelectItem>
                                    <SelectItem value="Poor">Poor</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </>
                      ) : (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    value={formData.company}
                                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({...formData, status: value})}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="address">Address</Label>
                              <Textarea
                                  id="address"
                                  value={formData.address}
                                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                                  rows={3}
                              />
                            </div>
                          </>
                      )}

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            rows={3}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingPerson ? 'Update' : 'Add'} {formData.type === 'customer' ? 'Customer' : 'Employee'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                All ({people.length})
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center">
                <UserCircle className="mr-2 h-4 w-4" />
                Staff ({stats.staff.total})
              </TabsTrigger>
              <TabsTrigger value="customer" className="flex items-center">
                <Building2 className="mr-2 h-4 w-4" />
                Customers ({stats.customers.total})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {activeTab !== 'customer' && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</CardTitle>
                      <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.staff.total}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Active employees</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">On Leave</CardTitle>
                      <UserX className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{stats.staff.onLeave}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Currently on leave</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">New Hires</CardTitle>
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.staff.newHires}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">This month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Performance</CardTitle>
                      <Star className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.staff.avgPerformance}/5</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Overall rating</p>
                    </CardContent>
                  </Card>
                </>
            )}

            {activeTab !== 'staff' && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</CardTitle>
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.customers.total}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">All customers</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Customers</CardTitle>
                      <UserCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.customers.active}</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Currently active</p>
                    </CardContent>
                  </Card>
                </>
            )}
          </div>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dark:text-gray-100">
                    {activeTab === 'staff' ? 'Staff' : activeTab === 'customer' ? 'Customer' : 'People'} Directory
                  </CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Manage {activeTab === 'staff' ? 'warehouse staff' : activeTab === 'customer' ? 'customer' : 'people'} information
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                      placeholder="Search..."
                      className="pl-10 dark:bg-gray-700 dark:text-gray-100"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {activeTab !== 'customer' && (
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-48 dark:bg-gray-700 dark:text-gray-100">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Warehouse">Warehouse</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Shipping">Shipping</SelectItem>
                        <SelectItem value="Quality Control">Quality Control</SelectItem>
                      </SelectContent>
                    </Select>
                )}

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32 dark:bg-gray-700 dark:text-gray-100">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:text-gray-100">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      {activeTab === 'customer' ? 'Customer' : 'Employee'}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Contact</th>
                    {activeTab !== 'customer' && (
                        <>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Department</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Position</th>
                        </>
                    )}
                    {activeTab === 'customer' && (
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Company</th>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    {activeTab !== 'customer' && (
                        <>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Hire Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Performance</th>
                        </>
                    )}
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filteredPeople.map((person) => (
                      <tr key={person.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center dark:bg-gray-700">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {person.name.charAt(0)}
                            </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{person.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">ID: {person.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                              <Mail className="mr-1 h-3 w-3" />
                              {person.email}
                            </div>
                            {person.phone && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                  <Phone className="mr-1 h-3 w-3" />
                                  {person.phone}
                                </div>
                            )}
                          </div>
                        </td>
                        {activeTab !== 'customer' && (
                            <>
                              <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{person.department || '-'}</td>
                              <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{person.position || '-'}</td>
                            </>
                        )}
                        {activeTab === 'customer' && (
                            <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{person.company || '-'}</td>
                        )}
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(person.status)}>{person.status}</Badge>
                        </td>
                        {activeTab !== 'customer' && (
                            <>
                              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                {person.hireDate ? new Date(person.hireDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-3 px-4">
                                {person.performance && (
                                    <Badge className={getPerformanceColor(person.performance)}>{person.performance}</Badge>
                                )}
                              </td>
                            </>
                        )}
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(person)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(person.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>

                {filteredPeople.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No {activeTab === 'staff' ? 'staff members' : activeTab === 'customer' ? 'customers' : 'people'} found matching your criteria.
                      </p>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}