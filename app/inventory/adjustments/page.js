"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Calendar, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export default function StockAdjustmentsPage() {
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [filter, setFilter] = useState({
        reason: 'all',
        startDate: '',
        endDate: '',
        productId: '',
        search: ''
    });

    // Function to fetch adjustments with filters
    const fetchAdjustments = async () => {
        setLoading(true);
        try {
            // Build query string from filter
            const params = new URLSearchParams();

            // Only add reason if not 'all'
            if (filter.reason && filter.reason !== 'all') {
                params.append('reason', filter.reason);
            }

            // Add date filters if present
            if (filter.startDate) params.append('startDate', filter.startDate);
            if (filter.endDate) params.append('endDate', filter.endDate);
            if (filter.productId) params.append('productId', filter.productId);

            const response = await fetch(`http://localhost:4000/api/stock-adjustments?${params}`);
            if (!response.ok) throw new Error('Failed to fetch adjustments');

            const data = await response.json();
            setAdjustments(data);

            if (initialLoad) {
                setInitialLoad(false);
            }
        } catch (error) {
            console.error('Error fetching adjustments:', error);
            // If fetch fails, set to empty array to avoid crashes
            setAdjustments([]);
        } finally {
            setLoading(false);
        }
    };
    
    

    // Initial load of adjustments
    useEffect(() => {
        fetchAdjustments();
    }, []);

    // Apply filters
    const applyFilter = () => {
        fetchAdjustments();
    };

    // Reset all filters and reload
    const resetFilter = () => {
        setFilter({
            reason: 'all',
            startDate: '',
            endDate: '',
            productId: '',
            search: ''
        });

        // Wait for state update and then fetch
        setTimeout(() => {
            fetchAdjustments();
        }, 0);
    };

    // Get color styling for the adjustment badges
    const getAdjustmentTypeColor = (quantity) => {
        return quantity > 0
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    };

    // Filter adjustments locally based on search term
    const filteredAdjustments = adjustments.filter(adjustment => {
        if (!filter.search) return true;

        const searchTerm = filter.search.toLowerCase();
        return (
            adjustment.product?.name?.toLowerCase().includes(searchTerm) ||
            adjustment.product?.sku?.toLowerCase().includes(searchTerm) ||
            adjustment.reason.toLowerCase().includes(searchTerm) ||
            (adjustment.notes && adjustment.notes.toLowerCase().includes(searchTerm))
        );
    });

    const handleDeleteAdjustment = async (id) => {
        if (!confirm("Are you sure you want to delete this adjustment?")) return;

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:4000/api/stock-adjustments/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete adjustment');

            // Remove the deleted adjustment from state
            setAdjustments(prev => prev.filter(adj => adj.id !== id));
        } catch (error) {
            console.error(error);
            alert('Error deleting adjustment');
        } finally {
            setLoading(false);
        }
    };



    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    // Function to validate date range
    const validateDateRange = () => {
        if (filter.startDate && filter.endDate) {
            const start = new Date(filter.startDate);
            const end = new Date(filter.endDate);
            return start <= end;
        }
        return true;
    };

    // Check if date range is valid
    const isDateRangeValid = validateDateRange();

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <div className="flex items-center space-x-2">
                            <Link href="/inventory">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back
                                </Button>
                            </Link>
                            <h1 className="text-3xl font-bold text-foreground">Stock Adjustment History</h1>
                        </div>
                        <p className="text-muted-foreground mt-1">View all inventory adjustments and stock movements</p>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4"/>
                            Export
                        </Button>
                    </div>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Filter Adjustments</CardTitle>
                        <div className="flex flex-wrap gap-4 mt-4">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-sm mb-1 block">Reason</label>
                                <Select
                                    value={filter.reason}
                                    onValueChange={(value) => setFilter({...filter, reason: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Reasons" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Reasons</SelectItem>
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

                            <div className="flex-1 min-w-[200px]">
                                <label className="text-sm mb-1 block">Start Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        type="date"
                                        className={`pl-10 ${!isDateRangeValid && filter.startDate ? 'border-red-500' : ''}`}
                                        value={filter.startDate}
                                        onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                                    />
                                </div>
                                {!isDateRangeValid && filter.startDate && (
                                    <p className="text-red-500 text-xs mt-1">Start date must be before end date</p>
                                )}
                            </div>

                            <div className="flex-1 min-w-[200px]">
                                <label className="text-sm mb-1 block">End Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        type="date"
                                        className={`pl-10 ${!isDateRangeValid && filter.endDate ? 'border-red-500' : ''}`}
                                        value={filter.endDate}
                                        onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex items-end space-x-2">
                                <Button
                                    onClick={applyFilter}
                                    disabled={!isDateRangeValid}
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Apply Filter
                                </Button>
                                <Button variant="outline" onClick={resetFilter}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search by product name, SKU, or reason..."
                                    className="pl-10"
                                    value={filter.search}
                                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2 text-muted-foreground">Loading adjustments...</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Product</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Adjustment</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Previous Stock</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">New Stock</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Reason</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Adjusted By</th>
                                        <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredAdjustments.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center py-8 text-muted-foreground">
                                                {initialLoad ? "Loading..." : "No stock adjustments found"}
                                                {!initialLoad && (
                                                    <div className="mt-2">
                                                        <Button variant="outline" size="sm" onClick={resetFilter}>
                                                            Clear filters
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAdjustments.map((adjustment) => (
                                            <tr key={adjustment.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4 text-foreground">
                                                    {formatDate(adjustment.createdAt)}
                                                </td>
                                                <td className="py-3 px-4 text-foreground">
                                                    <div>
                                                        <div className="font-medium">{adjustment.product?.name}</div>
                                                        <div className="text-sm text-muted-foreground">{adjustment.product?.sku}</div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={getAdjustmentTypeColor(adjustment.quantity)}>
                                                        {adjustment.quantity > 0 ? '+' : ''}{adjustment.quantity} units
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{adjustment.previousStock}</td>
                                                <td className="py-3 px-4 text-foreground">{adjustment.newStock}</td>
                                                <td className="py-3 px-4 text-foreground">
                                                    <Badge variant="outline">{adjustment.reason}</Badge>
                                                    {adjustment.notes && (
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {adjustment.notes}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground">{adjustment.adjustedBy || 'System'}</td>
                                                <td className="py-3 px-4">
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleDeleteAdjustment(adjustment.id)}
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>

                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}