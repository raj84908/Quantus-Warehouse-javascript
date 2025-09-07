'use client';

import { useState, useEffect } from 'react';
import { getProducts, addProduct } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Download, Upload, Plus, AlertTriangle, Package, DollarSign, ImageIcon } from "lucide-react"
import { useInventoryStats } from "../../hooks/InventoryStats";

export default function InventoryPage() {
  const { inventoryItems, stats, loading, refresh } = useInventoryStats();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(true);

  // Track categories
  const [categories, setCategories] = useState([
    "Electronics",
    "Kits",
    "Components",
    "Accessories"
  ]);
  const [newCategory, setNewCategory] = useState("");

  const [newItem, setNewItem] = useState({
    sku: '',
    name: '',
    category: '',
    location: '',
    stock: 0,
    minStock: 0,
    value: 0,
    status: 'IN_STOCK',
    image: null,
  });

  const [editItem, setEditItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle new category
  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: ['stock', 'minStock', 'value'].includes(name) ? Number(value) : value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image: reader.result }));
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await addProduct({
        ...newItem,
        stock: Number(newItem.stock),
        minStock: Number(newItem.minStock),
        value: Number(newItem.value),
        lastUpdated: new Date().toISOString(),
      });
      await refresh();
      setShowAddForm(false);
      setNewItem({
        sku: '',
        name: '',
        category: '',
        location: '',
        stock: 0,
        minStock: 0,
        value: 0,
        status: 'IN_STOCK',
        image: null,
      });
      setPreviewImage(null);
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Failed to add item. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "LOW_STOCK":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "OUT_OF_STOCK":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4"/> Export
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4"/> Import
            </Button>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4"/> Add Item
            </Button>
          </div>
        </div>

        {/* Add Item Form */}
        {(showAddForm || editItem) && (
          <div className="mb-6 p-6 border rounded-lg bg-card shadow-sm text-card-foreground">
            <h2 className="text-xl font-semibold mb-4">{editItem ? "Edit Inventory Item":"Add New Inventory Item"}</h2>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* SKU */}
              <div>
                <label className="block text-sm mb-1">SKU</label>
                <Input type="text" name="sku" value={newItem.sku} onChange={handleInputChange} required />
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm mb-1">Product Name</label>
                <Input type="text" name="name" value={newItem.name} onChange={handleInputChange} required />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm mb-1">Category</label>
                <Select
                  value={newItem.category}
                  onValueChange={(value) => setNewItem((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat, i) => (
                      <SelectItem key={i} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Add New Category */}
                <div className="flex space-x-2 mt-2">
                  <Input
                    type="text"
                    placeholder="Add new category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddCategory}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm mb-1">Location</label>
                <Input type="text" name="location" value={newItem.location} onChange={handleInputChange} required />
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm mb-1">Stock</label>
                <Input type="number" name="stock" value={newItem.stock} onChange={handleInputChange} min="0" required />
              </div>

              {/* Min Stock */}
              <div>
                <label className="block text-sm mb-1">Min Stock</label>
                <Input type="number" name="minStock" value={newItem.minStock} onChange={handleInputChange} min="0" required />
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm mb-1">Value ($)</label>
                <Input type="number" name="value" value={newItem.value} onChange={handleInputChange} step="0.01" min="0" required />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm mb-1">Status</label>
                <Select
                  value={newItem.status}
                  onValueChange={(value) => setNewItem((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_STOCK">IN_STOCK</SelectItem>
                    <SelectItem value="LOW_STOCK">LOW_STOCK</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">OUT_OF_STOCK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload */}
              <div className="col-span-2 border-2 border-dashed rounded-lg p-6 text-center">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="h-32 mx-auto object-contain mb-2" />
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to Upload</p>
                  </>
                )}
                <Input type="file" accept="image/*" onChange={handleFileSelect} />
              </div>

              {/* Buttons */}
              <div className="col-span-2 flex justify-end gap-2 pt-2">
                <Button type="submit" className="bg-primary text-primary-foreground">Save Item</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Inventory Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Inventory Items</CardTitle>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4"/> More Filters
              </Button>
            </div>
            <div className="flex items-center space-x-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                <Input
                  placeholder="Search inventory..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat, i) => (
                    <SelectItem key={i} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Product Name</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-left py-3 px-4">Min Stock</th>
                    <th className="text-left py-3 px-4">Value</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4">{item.category}</td>
                      <td className="py-3 px-4">{item.stock}</td>
                      <td className="py-3 px-4">{item.minStock}</td>
                      <td className="py-3 px-4">${item.value}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : "N/A"}
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
  );
}
