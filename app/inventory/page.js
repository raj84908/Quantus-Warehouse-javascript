'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProducts, addProduct } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {Search, Filter, Download, Upload, Plus, AlertTriangle, Package, DollarSign, ImageIcon, Edit} from "lucide-react"
import {useInventoryStats} from "../../hooks/InventoryStats";


export default function InventoryPage() {
    //const [inventoryItems, setInventoryItems] = useState([]);
    const {inventoryItems, stats, loading, refresh } = useInventoryStats();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    //const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(true);
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

    // Debounce the search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(timer);
    }, [searchTerm]);


    // Handle drag & drop image
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewItem(prev => ({ ...prev, image: reader.result }));
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
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



    // Handle adding new item
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

            await refresh();  // Call refresh from your useInventoryStats hook
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
            setPreviewImage(null)
        } catch (error) {
            alert('here')
            console.error('Failed to add item:', error);
            alert('Failed to add item. Please try again.');
        }
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:4000/api/products/${editItem.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...newItem,
                    stock: Number(newItem.stock),
                    minStock: Number(newItem.minStock),
                    value: Number(newItem.value),
                    lastUpdated: new Date().toISOString(),
                }),
            });

            if (!res.ok) throw new Error("Failed to update");

            await refresh();
            setEditItem(null);
            setNewItem({
                sku: "",
                name: "",
                category: "",
                location: "",
                stock: 0,
                minStock: 0,
                value: 0,
                status: "IN_STOCK",
                image: null,
            });
            setPreviewImage(null);
        } catch (error) {
            console.error(error);
            alert("Failed to update item");
        }
    };


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: ['stock', 'minStock', 'value'].includes(name) ? Number(value) : value
        }));
    };

    const statistics = [
        {
            title: "Total Items",
            value: stats.totalItems,
            description: "Across all categories",
            icon: Package,
        },
        {
            title: "Low Stock",
            value: stats.lowStock.toString(),
            description: "Items need restocking",
            icon: AlertTriangle,
            color: "text-orange-600",
        },
        {
            title: "Out of Stock",
            value: stats.outOfStock.toString(),
            description: "Items unavailable",
            icon: AlertTriangle,
            color: "text-red-600",
        },
        {
            title: "Total Value",
            value: `$${stats.totalValue.toLocaleString()}`,
            description: "Current inventory value",
            icon: DollarSign,
        }
    ]

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
                        <Button onClick={() => setShowAddForm(true)}>
                            <Plus className="mr-2 h-4 w-4"/>
                            Add Item
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statistics.map((stat, index) => {
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

                {/* Add Item Form */}
                {(showAddForm || editItem) && (
                    <div className="mb-6 p-6 border rounded-lg bg-card shadow-sm text-card-foreground">
                        <h2 className="text-xl font-semibold mb-4">{editItem ? "Edit Inventory item":"Add New Inventory Item"}
                        </h2>
                        <form onSubmit={editItem ? handleUpdateItem: handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* SKU */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">SKU</label>
                                <Input
                                    type="text"
                                    name="sku"
                                    value={newItem.sku || ''}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">Product Name</label>
                                <Input
                                    type="text"
                                    name="name"
                                    value={newItem.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">Category</label>
                                <Select
                                    value={newItem.category || ''}
                                    onValueChange={(value) =>
                                        setNewItem((prev) => ({ ...prev, category: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Electronics">Electronics</SelectItem>
                                        <SelectItem value="Kits">Kits</SelectItem>
                                        <SelectItem value="Components">Components</SelectItem>
                                        <SelectItem value="Accessories">Accessories</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">Location</label>
                                <Input
                                    type="text"
                                    name="location"
                                    value={newItem.location || ''}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Stock */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">Stock</label>
                                <Input
                                    type="number"
                                    name="stock"
                                    value={newItem.stock || 0}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                />
                            </div>

                            {/* Min Stock */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">Min Stock</label>
                                <Input
                                    type="number"
                                    name="minStock"
                                    value={newItem.minStock || 0}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                />
                            </div>

                            {/* Value */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">Value ($)</label>
                                <Input
                                    type="number"
                                    name="value"
                                    value={newItem.value || 0}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-muted-foreground">Status</label>
                                <Select
                                    value={newItem.status || ''}
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
                            <div
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                className="col-span-1 md:col-span-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer"
                            >
                                {previewImage ? (
                                    <img src={previewImage} alt="Preview" className="h-32 object-contain mb-2" />
                                ) : (
                                    <>
                                        <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">Drag & Drop or Click to Upload</p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="fileInput"
                                />
                                <label htmlFor="fileInput" className="mt-2 text-xs text-primary underline cursor-pointer">
                                    Choose File
                                </label>
                            </div>
                            
                            {/* Buttons */}
                            <div className="col-span-1 md:col-span-2 flex justify-end gap-2 pt-2">
                                <Button
                                    type="submit"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    Save Item
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowAddForm(false)}
                                    className="border-border"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

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
                                <Input
                                    placeholder="Search inventory..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {loading && searchTerm !== debouncedSearchTerm && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                    </div>
                                )}
                            </div>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                                    <th className="text-left py-3 px-4 font-medium text-foreground">Product Name</th>
                                    <th className="text-left py-3 px-4 font-medium text-foreground">Category</th>
                                    <th className="text-left py-3 px-4 font-medium text-foreground">Stock</th>
                                    <th className="text-left py-3 px-4 font-medium text-foreground">Min Stock</th>
                                    <th className="text-left py-3 px-4 font-medium text-foreground">Value</th>
                                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                                    <th className="text-left py-3 px-4 font-medium text-foreground">Last Updated</th>
                                    <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {inventoryItems.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/50">
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
                                        <td className="py-3 px-4 text-foreground">${item.value}</td>
                                        <td className="py-3 px-4">
                                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                        </td>
                                        <td className="py-3 px-4 text-muted-foreground text-sm">
                                            {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="outline">•••</Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditItem(null);
                                                            setNewItem({
                                                                sku: item.sku,
                                                                name: item.name,
                                                                category: item.category,
                                                                location: item.location,
                                                                stock: item.stock,
                                                                minStock: item.minStock,
                                                                value: item.value,
                                                                status: item.status,
                                                                image: item.image,
                                                            });
                                                            setPreviewImage(item.image || null);
                                                        }}
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={async () => {
                                                            if (confirm('Are you sure you want to delete this item?')) {
                                                                try {
                                                                    const res = await fetch(`http://localhost:4000/api/products/${item.id}`, {
                                                                        method: "DELETE",
                                                                    });
                                                                    if (!res.ok) throw new Error("Failed to delete");
                                                                    await refresh();
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert("Failed to delete product");
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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