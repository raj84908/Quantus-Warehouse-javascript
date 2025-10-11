'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, ArrowLeft, Package, Save } from "lucide-react";

export default function AddProductPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [newProduct, setNewProduct] = useState({
        sku: '',
        name: '',
        categoryId: '',
        location: '',
        stock: 0,
        minStock: 0,
        value: 0,
        status: 'IN_STOCK',
        image: null,
    });

    const API_BASE = '';

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/categories`);
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // For number fields, handle properly
        const processedValue = ['stock', 'minStock', 'value'].includes(name)
            ? (value === '' ? '' : parseFloat(value))
            : value;

        setNewProduct(prev => ({
            ...prev,
            [name]: processedValue
        }));
    };

    // Handle drag & drop image
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewProduct(prev => ({ ...prev, image: reader.result }));
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
                setNewProduct(prev => ({ ...prev, image: reader.result }));
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_BASE}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProduct,
                    stock: Number(newProduct.stock),
                    minStock: Number(newProduct.minStock),
                    value: Number(newProduct.value),
                    categoryId: Number(newProduct.categoryId),
                    lastUpdated: new Date().toISOString(),
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to add product');
            }

            // Redirect to inventory page on success
            router.push('/inventory');
        } catch (error) {
            console.error('Error adding product:', error);
            alert(error.message || 'Failed to add product. Please try again.');
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
                            onClick={() => router.push('/inventory')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Inventory
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
                            <p className="text-muted-foreground mt-1">Add a new item to your inventory</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl">
                    <form onSubmit={handleSubmit}>
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center">
                                    <Package className="h-5 w-5 mr-2" />
                                    Product Information
                                </CardTitle>
                                <CardDescription>Enter the details for the new product</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* SKU */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                            SKU *
                                        </label>
                                        <Input
                                            type="text"
                                            name="sku"
                                            value={newProduct.sku}
                                            onChange={handleInputChange}
                                            placeholder="Enter product SKU"
                                            required
                                        />
                                    </div>

                                    {/* Product Name */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                            Product Name *
                                        </label>
                                        <Input
                                            type="text"
                                            name="name"
                                            value={newProduct.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter product name"
                                            required
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                            Category *
                                        </label>
                                        <Select
                                            value={newProduct.categoryId ? newProduct.categoryId.toString() : ""}
                                            onValueChange={(id) =>
                                                setNewProduct(prev => ({ ...prev, categoryId: Number(id) }))
                                            }
                                            required
                                        >
                                            <SelectTrigger>
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
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                            Location *
                                        </label>
                                        <Input
                                            type="text"
                                            name="location"
                                            value={newProduct.location}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Aisle A, Shelf 3"
                                            required
                                        />
                                    </div>

                                    {/* Stock */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                            Current Stock *
                                        </label>
                                        <Input
                                            type="number"
                                            name="stock"
                                            value={newProduct.stock}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            required
                                            min="0"
                                        />
                                    </div>

                                    {/* Min Stock */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                            Minimum Stock Level *
                                        </label>
                                        <Input
                                            type="number"
                                            name="minStock"
                                            value={newProduct.minStock}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            required
                                            min="0"
                                        />
                                    </div>

                                    {/* Value */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                            Unit Value ($) *
                                        </label>
                                        <Input
                                            type="number"
                                            name="value"
                                            value={newProduct.value}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                            Status *
                                        </label>
                                        <Select
                                            value={newProduct.status}
                                            onValueChange={(value) => setNewProduct(prev => ({ ...prev, status: value }))}
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
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-muted-foreground">
                                        Product Image
                                    </label>
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={(e) => e.preventDefault()}
                                        className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                                    >
                                        {previewImage ? (
                                            <div className="text-center">
                                                <img
                                                    src={previewImage}
                                                    alt="Preview"
                                                    className="h-48 object-contain mb-4 mx-auto"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setPreviewImage(null);
                                                        setNewProduct(prev => ({ ...prev, image: null }));
                                                    }}
                                                >
                                                    Remove Image
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Drag & Drop or Click to Upload
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    PNG, JPG, GIF up to 10MB
                                                </p>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            id="fileInput"
                                        />
                                        {!previewImage && (
                                            <label
                                                htmlFor="fileInput"
                                                className="mt-4 text-sm text-primary underline cursor-pointer"
                                            >
                                                Choose File
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-4 pt-6 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push('/inventory')}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !newProduct.categoryId}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSubmitting ? 'Adding Product...' : 'Add Product'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </div>
    );
}
