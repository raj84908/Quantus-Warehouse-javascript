import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Upload, Plus, AlertTriangle, Package, DollarSign } from "lucide-react"
import {getProducts} from "/lib/api";

export default async function InventoryPage() {

  const inventoryItems = await getProducts();
  console.log("Count" + inventoryItems.length);
  const stats = [
        {
          title: "Total Items",
          value: "1,716",
          description: "Across all categories",
          icon: Package,
        },
        {
          title: "Low Stock",
          value: "23",
          description: "Items need restocking",
          icon: AlertTriangle,
          color: "text-orange-600",
        },
        {
          title: "Out of Stock",
          value: "5",
          description: "Items unavailable",
          icon: AlertTriangle,
          color: "text-red-600",
        },
        {
          title: "Total Value",
          value: "$2.4M",
          description: "Current inventory value",
          icon: DollarSign,
        },
      ]

      /*
      const inventoryItems = [
        {
          sku: "WPA-001",
          name: "Widget Pro A",
          category: "Electronics",
          stock: 847,
          minStock: 100,
          location: "A1-B2",
          value: "$25.99",
          status: "In Stock",
          lastUpdated: "2 hours ago",
        },
        {
          sku: "CX-205",
          name: "Component X",
          category: "Components",
          stock: 623,
          minStock: 50,
          location: "B3-C1",
          value: "$12.50",
          status: "In Stock",
          lastUpdated: "4 hours ago",
        },
        {
          sku: "PK-150",
          name: "Premium Kit",
          category: "Kits",
          stock: 12,
          minStock: 25,
          location: "C2-D4",
          value: "$89.99",
          status: "Low Stock",
          lastUpdated: "1 hour ago",
        },
        {
          sku: "WB-300",
          name: "Widget Basic",
          category: "Electronics",
          stock: 0,
          minStock: 75,
          location: "A2-B1",
          value: "$15.99",
          status: "Out of Stock",
          lastUpdated: "6 hours ago",
        },
        {
          sku: "AC-450",
          name: "Accessory Pack",
          category: "Accessories",
          stock: 234,
          minStock: 30,
          location: "D1-E2",
          value: "$8.75",
          status: "In Stock",
          lastUpdated: "3 hours ago",
        },
        
       
      ]
      */

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "LOW_STOCK":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4"/>
                Export
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4"/>
                Import
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4"/>
                Add Item
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color || "text-primary"}`}/>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${stat.color || ""}`}>{stat.value}</div>
                      <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                  </Card>
              )
            })}
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>Manage your warehouse inventory and stock levels</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4"/>
                  More Filters
                </Button>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                  <Input placeholder="Search inventory..." className="pl-10"/>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="components">Components</SelectItem>
                    <SelectItem value="kits">Kits</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-foreground">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Product Name</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Min Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Value</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Last Updated</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {inventoryItems.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-foreground">{item.sku}</td>
                        <td className="py-3 px-4 text-foreground">{item.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{item.category}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                          <span
                              className={`font-medium ${item.stock <= item.minStock ? "text-red-600 dark:text-red-400" : "text-foreground"}`}
                          >
                            {item.stock}
                          </span>
                            {item.stock <= item.minStock && item.stock > 0 && (
                                <AlertTriangle className="ml-1 h-4 w-4 text-orange-500"/>
                            )}
                            {item.stock === 0 && <AlertTriangle className="ml-1 h-4 w-4 text-red-500"/>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{item.minStock}</td>
                        <td className="py-3 px-4 text-muted-foreground">{item.location}</td>
                        <td className="py-3 px-4 text-foreground">{item.value}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">{item.lastUpdated}</td>
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
