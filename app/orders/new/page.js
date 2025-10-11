'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, X, ShoppingCart, Package, Trash2, ArrowLeft, Minus, FileText } from "lucide-react";

export default function NewOrderPage() {
    const router = useRouter();
    const [allCustomers, setAllCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        billingAddress: "",
        _search: ""
    });

    const API_BASE = '';

    // Fetch customers
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/people`);
                const data = await res.json();
                setAllCustomers(data.filter((p) => p.type === "customer"));
            } catch (err) {
                console.error('Failed to fetch customers:', err);
            }
        };
        fetchCustomers();
    }, []);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/products`);
                const data = await res.json();
                setProducts(data);
            } catch (err) {
                console.error('Failed to fetch products:', err);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        (product.category?.name || '').toLowerCase().includes(productSearch.toLowerCase())
    );

    const addItemToOrder = (product) => {
        const existingItem = orderItems.find(item => item.sku === product.sku);

        if (existingItem) {
            // Increase quantity if already in order
            setOrderItems(orderItems.map(item =>
                item.sku === product.sku
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            // Add new item
            setOrderItems([
                ...orderItems,
                {
                    id: Date.now(),
                    productId: product.id,
                    sku: product.sku,
                    name: product.name,
                    price: parseFloat(product.value) || 0,
                    quantity: 1,
                    category: product.category?.name
                }
            ]);
        }
    };

    const updateOrderItem = (id, field, value) => {
        setOrderItems(orderItems.map(item => {
            if (item.id === id) {
                if (field === 'quantity') {
                    return { ...item, quantity: parseInt(value) || 1 };
                }
                if (field === 'price') {
                    return { ...item, price: parseFloat(value) || 0 };
                }
            }
            return item;
        }));
    };

    const removeOrderItem = (id) => {
        setOrderItems(orderItems.filter(item => item.id !== id));
    };

    const calculateSubtotal = () => {
        return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const calculateTotal = () => {
        return calculateSubtotal();
    };

    const updateCustomerInfo = (field, value) => {
        setCustomerInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!customerInfo.companyName || !customerInfo.email) {
            alert('Please enter customer name and email');
            return;
        }

        if (orderItems.length === 0) {
            alert('Please add at least one product to the order');
            return;
        }

        setIsSubmitting(true);

        try {
            const tempOrderNumber = `ORD${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

            const newOrder = {
                orderId: tempOrderNumber,
                customer: customerInfo.companyName,
                email: customerInfo.email,
                phone: customerInfo.phone,
                billingAddress: customerInfo.billingAddress,
                items: orderItems.map(item => ({
                    sku: item.sku,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    productId: item.productId
                })),
                subtotal: calculateSubtotal(),
                total: calculateTotal(),
                status: "Processing",
                priority: "Medium",
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                assignedTo: "System"
            };

            const res = await fetch(`${API_BASE}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create order');
            }

            alert('Order created successfully!');
            router.push('/orders');
        } catch (error) {
            console.error('Error creating order:', error);
            alert(error.message || 'Failed to create order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/orders')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Orders
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Create New Order</h1>
                            <p className="text-muted-foreground mt-1">Add products and customer details for a new order</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Top Section: Two Columns */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        {/* LEFT COLUMN: Product Search & Selection */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-foreground">Search Products</h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                    <Input
                                        placeholder="Search products..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="pl-10 h-12 text-base"
                                    />
                                </div>
                            </div>

                            {/* Product Cards */}
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {filteredProducts.map((product) => (
                                    <Card key={product.sku} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                                        {(product.shopifyImageUrl || product.image) ? (
                                                            <img
                                                                src={product.shopifyImageUrl || `${API_BASE}${product.image}`}
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
                                                        <h4 className="font-semibold text-foreground mb-1 text-sm">
                                                            {product.name}
                                                        </h4>
                                                        <div className="flex items-center space-x-4">
                                                            <span className="text-lg font-bold text-green-600">${product.value}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {product.category?.name}
                                                            </Badge>
                                                            <span className="text-sm text-muted-foreground">
                                                                Stock: {product.stock}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => addItemToOrder(product)}
                                                    size="sm"
                                                    disabled={product.stock <= 0}
                                                    className="ml-4"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Item
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Customer Information */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-foreground">Customer Information</h3>

                            <div className="mb-2 relative">
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Search Saved Customer
                                </label>
                                <Input
                                    placeholder="Search company, name, or email"
                                    value={customerInfo._search || ""}
                                    onChange={(e) =>
                                        setCustomerInfo((prev) => ({
                                            ...prev,
                                            _search: e.target.value,
                                        }))
                                    }
                                    className="h-12"
                                />
                                {customerInfo._search && (
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded mt-1 max-h-44 overflow-y-auto shadow z-30 absolute left-0 right-0">
                                        {allCustomers
                                            .filter(
                                                (c) =>
                                                    (c.company || "")
                                                        .toLowerCase()
                                                        .includes(customerInfo._search.toLowerCase()) ||
                                                    (c.name || "")
                                                        .toLowerCase()
                                                        .includes(customerInfo._search.toLowerCase()) ||
                                                    (c.email || "").toLowerCase().includes(customerInfo._search.toLowerCase())
                                            )
                                            .slice(0, 8)
                                            .map((customer) => (
                                                <div
                                                    key={customer.id}
                                                    className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition text-foreground"
                                                    onClick={() => {
                                                        setCustomerInfo({
                                                            companyName: customer.company || customer.name,
                                                            contactPerson: customer.name,
                                                            email: customer.email || "",
                                                            phone: customer.phone || "",
                                                            billingAddress: customer.address || "",
                                                            _search: "",
                                                        })
                                                    }}
                                                >
                                                    <div className="font-semibold">{customer.company || customer.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {customer.email}
                                                        {customer.phone ? ` • ${customer.phone}` : ""}
                                                    </div>
                                                </div>
                                            ))}
                                        {allCustomers.filter(
                                            (c) =>
                                                (c.company || "").toLowerCase().includes(customerInfo._search.toLowerCase()) ||
                                                (c.name || "").toLowerCase().includes(customerInfo._search.toLowerCase()) ||
                                                (c.email || "").toLowerCase().includes(customerInfo._search.toLowerCase())
                                        ).length === 0 && (
                                            <div className="px-4 py-2 text-muted-foreground text-xs">No matches</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Company Name *</label>
                                        <Input
                                            placeholder="Enter company name"
                                            value={customerInfo.companyName}
                                            onChange={(e) => updateCustomerInfo("companyName", e.target.value)}
                                            className="h-12"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Contact Person</label>
                                        <Input
                                            placeholder="Enter contact name"
                                            value={customerInfo.contactPerson}
                                            onChange={(e) => updateCustomerInfo("contactPerson", e.target.value)}
                                            className="h-12"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Email Address *</label>
                                        <Input
                                            type="email"
                                            placeholder="Enter email address"
                                            value={customerInfo.email}
                                            onChange={(e) => updateCustomerInfo("email", e.target.value)}
                                            className="h-12"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Phone Number</label>
                                        <Input
                                            placeholder="Enter phone number"
                                            value={customerInfo.phone}
                                            onChange={(e) => updateCustomerInfo("phone", e.target.value)}
                                            className="h-12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Billing Address</label>
                                    <textarea
                                        placeholder="Enter billing address"
                                        value={customerInfo.billingAddress}
                                        onChange={(e) => updateCustomerInfo("billingAddress", e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-input rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Order Items & Summary */}
                    <div className="border-t pt-8">
                        <h3 className="text-xl font-semibold mb-6 text-foreground">Order Items</h3>

                        {orderItems.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No items added to order yet</p>
                                <p className="text-sm">Search and add products from the left panel</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Items Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-semibold text-foreground">Item</th>
                                                <th className="text-left py-3 px-4 font-semibold text-foreground w-24">Quantity</th>
                                                <th className="text-left py-3 px-4 font-semibold text-foreground w-32">Set Price</th>
                                                <th className="text-left py-3 px-4 font-semibold text-foreground w-32">Total</th>
                                                <th className="text-left py-3 px-4 font-semibold text-foreground w-20">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderItems.map((item) => (
                                                <tr key={item.id} className="border-b">
                                                    <td className="py-4 px-4">
                                                        <div>
                                                            <div className="font-medium text-foreground">{item.name}</div>
                                                            <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateOrderItem(item.id, 'quantity', e.target.value)}
                                                            className="w-20"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.price}
                                                            onChange={(e) => updateOrderItem(item.id, 'price', e.target.value)}
                                                            className="w-24"
                                                        />
                                                    </td>
                                                    <td className="py-4 px-4 font-semibold text-foreground">
                                                        ${(item.quantity * item.price).toFixed(2)}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeOrderItem(item.id)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary */}
                                <div className="flex justify-end">
                                    <div className="w-80 space-y-3 bg-muted p-6 rounded-lg">
                                        <div className="flex justify-between text-foreground">
                                            <span className="font-medium">Subtotal:</span>
                                            <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                                        </div>
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between text-xl font-bold text-foreground">
                                                <span>Total:</span>
                                                <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/orders')}
                            className="px-8 py-3"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || orderItems.length === 0 || !customerInfo.companyName || !customerInfo.email}
                            className="px-8 py-3"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Creating Order...' : 'Create Order'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
