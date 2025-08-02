import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  price: number
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

export default function ProductsPage() {
  const products: Product[] = [
    {
      id: "1",
      name: "Wireless Bluetooth Headphones",
      sku: "WBH-001",
      category: "Electronics",
      stock: 45,
      price: 79.99,
      status: "In Stock",
    },
    {
      id: "2",
      name: "Ergonomic Office Chair",
      sku: "EOC-002",
      category: "Furniture",
      stock: 8,
      price: 299.99,
      status: "Low Stock",
    },
    {
      id: "3",
      name: "Laptop Stand Adjustable",
      sku: "LSA-003",
      category: "Accessories",
      stock: 0,
      price: 49.99,
      status: "Out of Stock",
    },
    {
      id: "4",
      name: "Wireless Mouse",
      sku: "WM-004",
      category: "Electronics",
      stock: 23,
      price: 29.99,
      status: "In Stock",
    },
    {
      id: "5",
      name: "Standing Desk Converter",
      sku: "SDC-005",
      category: "Furniture",
      stock: 12,
      price: 199.99,
      status: "In Stock",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800"
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800"
      case "Out of Stock":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-2">Manage your product inventory</p>
          </div>
          <Link href="/products/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search products..." className="pl-10" />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>{products.length} products in your warehouse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Stock</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                      <td className="py-3 px-4 text-gray-600">{product.category}</td>
                      <td className="py-3 px-4 text-gray-900 font-medium">{product.stock}</td>
                      <td className="py-3 px-4 text-gray-900">${product.price}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Link href={`/products/${product.id}`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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
