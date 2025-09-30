'use client';

import { useState, useEffect, useCallback ,useMemo} from 'react';
import { getProducts, addProduct } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Search,
    Filter,
    Download,
    Upload,
    Plus,
    AlertTriangle,
    Package,
    DollarSign,
    ImageIcon,
    Edit,
    X,
    Minus,
    TrendingUp,
    TrendingDown,
    Clipboard
} from "lucide-react"
import {useInventoryStats} from "../../hooks/InventoryStats";

export default function InventoryPage() {
    const {inventoryItems, stats, loading, refresh } = useInventoryStats();
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showAddForm, setShowAddForm] = useState(false);
    const [showStockAdjustmentModal, setShowStockAdjustmentModal] = useState(false);
    const [stockAdjustmentItems, setStockAdjustmentItems] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [categories, setCategories] = useState([]);
    const [adjustmentReason, setAdjustmentReason] = useState("");
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


    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const [editItem, setEditItem] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const filteredInventoryItems = useMemo(() => {
        let filtered = inventoryItems;
 
        // Apply search filter
        if (debouncedSearchTerm) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                item.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                item.category.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                item.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter(item => {
                const categoryName = item.category?.name || '';
                return categoryName.toLowerCase() === selectedCategory.toLowerCase();
            });
        }

        return filtered;
    }, [inventoryItems, debouncedSearchTerm, selectedCategory]);
    
    
    // Debounce the search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/categories`); // make sure you have this route
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };

        fetchCategories();
    }, []);

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
            setPreviewImage(null)
        } catch (error) {
            console.error('Failed to add item:', error);
            alert('Failed to add item. Please try again.');
        }
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/products/${editItem.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sku: newItem.sku,
                    name: newItem.name,
                    categoryId: Number(newItem.categoryId), // important!
                    location: newItem.location,
                    stock: Number(newItem.stock),
                    minStock: Number(newItem.minStock),
                    value: Number(newItem.value),
                    status: newItem.status,
                    image: newItem.image || null,
                }),
            });

            if (!res.ok) throw new Error("Failed to update");

            await refresh();
            setEditItem(null);
            setNewItem({
                sku: "",
                name: "",
                categoryId: "",
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

        // For number fields, use parseFloat instead of Number to properly handle decimals
        // Only convert to number if the value is not empty
        const processedValue = ['stock', 'minStock', 'value'].includes(name)
            ? (value === '' ? '' : parseFloat(value))
            : value;

        setNewItem(prev => ({
            ...prev,
            [name]: processedValue
        }));
    };


    // Stock Adjustment Functions
    const addItemToStockAdjustment = (product) => {
        const existingItem = stockAdjustmentItems.find(item => item.sku === product.sku);

        if (existingItem) {
            // If item already exists, don't add duplicate
            return;
        } else {
            // Add new item
            setStockAdjustmentItems([
                ...stockAdjustmentItems,
                {
                    id: Date.now(),
                    sku: product.sku,
                    name: product.name,
                    currentStock: product.stock,
                    adjustment: 0,
                    adjustmentType: 'add', // 'add' or 'deduct'
                    productId: product.id
                }
            ]);
        }
    };

    const removeItemFromStockAdjustment = (id) => {
        setStockAdjustmentItems(stockAdjustmentItems.filter(item => item.id !== id));
    };

    const updateStockAdjustmentItem = (id, field, value) => {
        setStockAdjustmentItems(stockAdjustmentItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const calculateNewStock = (item) => {
        if (item.adjustmentType === 'add') {
            return item.currentStock + Math.abs(Number(item.adjustment));
        } else {
            return Math.max(0, item.currentStock - Math.abs(Number(item.adjustment)));
        }
    };

    const handleStockAdjustment = async () => {
        try {
            // Process each item
            for (const item of stockAdjustmentItems) {
                if (item.adjustment === 0) continue; // Skip items with no adjustment

                // Calculate the adjustment quantity (positive for add, negative for deduct)
                const quantity = item.adjustmentType === 'add'
                    ? Math.abs(Number(item.adjustment))
                    : -Math.abs(Number(item.adjustment));

                // Use the new stock adjustment endpoint
                const res = await fetch(`${API_BASE}/api/stock-adjustments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: item.productId,
                        quantity: quantity,
                        reason: adjustmentReason,
                        notes: `Stock ${item.adjustmentType === 'add' ? 'added' : 'removed'}: ${Math.abs(quantity)} units`,
                        adjustedBy: 'User' // In a real app, you'd use the authenticated user's name
                    })
                });

                if (!res.ok) throw new Error(`Failed to update ${item.name}`);
            }

            // Refresh inventory and reset modal
            await refresh();
            setStockAdjustmentItems([]);
            setProductSearch('');
            setAdjustmentReason('');
            setShowStockAdjustmentModal(false);
            alert('Stock adjustments completed successfully!');
        } catch (error) {
            console.error('Error adjusting stock:', error);
            alert('Error adjusting stock. Please try again.');
        }
    };

    // Filter products for stock adjustment based on search
    const filteredProductsForAdjustment = inventoryItems.filter(item =>
        item.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        item.category.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(productSearch.toLowerCase())
    );

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
                        <Button variant="outline" onClick={() => setShowStockAdjustmentModal(true)}>
                            <Clipboard className="mr-2 h-4 w-4"/>
                            Adjust Stock
                        </Button>
                        <Button onClick={() => setShowAddForm(true)}>
                            <Plus className="mr-2 h-4 w-4"/>
                            Add Item
                        </Button>
                    </div>
                </div>

                {/* Stock Adjustment Modal */}
                {showStockAdjustmentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full h-full max-w-[98vw] max-h-[98vh] overflow-y-auto">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Stock Adjustment</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowStockAdjustmentModal(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Top Section: Two Columns */}
                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    {/* LEFT COLUMN: Product Search & Selection */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Search Products</h3>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                                <Input
                                                    placeholder="Search products for stock adjustment..."
                                                    value={productSearch}
                                                    onChange={(e) => setProductSearch(e.target.value)}
                                                    className="pl-10 h-12 text-base"
                                                />
                                            </div>
                                        </div>

                                        {/* Product Cards */}
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {filteredProductsForAdjustment.map((product) => (
                                                <Card key={product.sku} className="hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start space-x-4 flex-1">
                                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                                                    {product.image ? (
                                                                        <img
                                                                            src={`${API_BASE}${product.image}`}
                                                                            alt={product.name}
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => {
                                                                                e.target.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <Package className="h-8 w-8 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">
                                                                        {product.name}
                                                                    </h4>
                                                                    <div className="flex items-center space-x-4">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {product.category?.name}
                                                                        </Badge>
                                                                        <span className="text-sm font-medium text-blue-600">
                                                                            Current Stock: {product.stock}
                                                                        </span>
                                                                        <span className="text-sm text-gray-500">
                                                                            SKU: {product.sku}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                onClick={() => addItemToStockAdjustment(product)}
                                                                size="sm"
                                                                disabled={stockAdjustmentItems.some(item => item.sku === product.sku)}
                                                                className="ml-4"
                                                            >
                                                                <Plus className="h-4 w-4 mr-1" />
                                                                {stockAdjustmentItems.some(item => item.sku === product.sku) ? 'Added' : 'Add Item'}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN: Adjustment Reason */}
                                    <div className="space-y-6">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Adjustment Information</h3>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    Reason for Adjustment
                                                </label>
                                                <Select
                                                    value={adjustmentReason}
                                                    onValueChange={setAdjustmentReason}
                                                >
                                                    <SelectTrigger className="h-12">
                                                        <SelectValue placeholder="Select reason for stock adjustment" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="damaged">Damaged Goods</SelectItem>
                                                        <SelectItem value="received">Stock Received</SelectItem>
                                                        <SelectItem value="returned">Customer Return</SelectItem>
                                                        <SelectItem value="lost">Lost/Stolen</SelectItem>
                                                        <SelectItem value="expired">Expired</SelectItem>
                                                        <SelectItem value="recount">Physical Recount</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Instructions</h4>
                                                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                                    <li>• Search and select products from the left panel</li>
                                                    <li>• Choose to add or deduct stock for each item</li>
                                                    <li>• Enter the quantity to adjust</li>
                                                    <li>• Review changes before confirming</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Section: Selected Items for Adjustment */}
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-8">
                                    <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Stock Adjustments</h3>

                                    {stockAdjustmentItems.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No items selected for stock adjustment</p>
                                            <p className="text-sm">Search and add products from the left panel</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Items Table */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                    <tr className="border-b border-gray-200 dark:border-gray-600">
                                                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Product</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-32">Current Stock</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-32">Adjustment</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-32">Quantity</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-32">New Stock</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100 w-20">Action</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {stockAdjustmentItems.map((item) => (
                                                        <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                                                            <td className="py-4 px-4">
                                                                <div>
                                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.sku}</div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">
                                                                {item.currentStock}
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <Select
                                                                    value={item.adjustmentType}
                                                                    onValueChange={(value) => updateStockAdjustmentItem(item.id, 'adjustmentType', value)}
                                                                >
                                                                    <SelectTrigger className="w-24">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="add">
                                                                            <div className="flex items-center">
                                                                                <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                                                                                Add
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="deduct">
                                                                            <div className="flex items-center">
                                                                                <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
                                                                                Deduct
                                                                            </div>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    value={item.adjustment}
                                                                    onChange={(e) => updateStockAdjustmentItem(item.id, 'adjustment', parseInt(e.target.value) || 0)}
                                                                    className="w-20"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                    <span className={`font-semibold ${
                                                                        calculateNewStock(item) !== item.currentStock
                                                                            ? (item.adjustmentType === 'add' ? 'text-green-600' : 'text-red-600')
                                                                            : 'text-gray-900 dark:text-gray-100'
                                                                    }`}>
                                                                        {calculateNewStock(item)}
                                                                    </span>
                                                            </td>
                                                            <td className="py-4 px-4">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => removeItemFromStockAdjustment(item.id)}
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowStockAdjustmentModal(false)}
                                        className="px-8 py-3"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleStockAdjustment}
                                        disabled={stockAdjustmentItems.length === 0 || !adjustmentReason || stockAdjustmentItems.every(item => item.adjustment === 0)}
                                        className="px-8 py-3"
                                    >
                                        <Clipboard className="mr-2 h-4 w-4" />
                                        Apply Stock Adjustments
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                        <h2 className="text-xl font-semibold mb-4">{editItem ? "Edit Inventory item":"Add New Inventory Item"}</h2>
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
                                    value={newItem.categoryId ? newItem.categoryId.toString() : ""}
                                    onValueChange={(id) =>
                                        setNewItem((prev) => ({ ...prev, categoryId: Number(id) }))
                                    }
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
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
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditItem(null);
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
                                    }}
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
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
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
                                {filteredInventoryItems.map((item, index) => (
                                    <tr key={index} className="border-b hover:bg-muted/50">
                                        <td className="py-3 px-4 text-foreground">{item.name}</td>
                                        <td className="py-3 px-4 text-muted-foreground">{item.category?.name}</td>
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
                                                            setEditItem(item);
                                                            setNewItem({
                                                                sku: item.sku,
                                                                name: item.name,
                                                                categoryId: item.category?.id,
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
                                                                    const res = await fetch(`${API_BASE}/api/products/${item.id}`, {
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