'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Truck, Package, Calendar, MapPin } from "lucide-react";

export default function NewShipmentPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shipmentData, setShipmentData] = useState({
        trackingNumber: '',
        carrier: 'UPS',
        shippingAddress: '',
        estimatedDelivery: '',
        notes: '',
    });

    const API_BASE = '';

    // Fetch orders (ideally only pending/confirmed orders)
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/orders`);
                const data = await res.json();
                // Filter for orders that can be shipped (not cancelled or already shipped)
                const shippableOrders = data.filter(order =>
                    order.status !== 'CANCELLED' && order.status !== 'SHIPPED'
                );
                setOrders(shippableOrders);
            } catch (err) {
                console.error('Failed to fetch orders:', err);
            }
        };
        fetchOrders();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setShipmentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const selectedOrderData = orders.find(o => o.id === parseInt(selectedOrder));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedOrder) {
            alert('Please select an order');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_BASE}/api/shipments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: parseInt(selectedOrder),
                    trackingNumber: shipmentData.trackingNumber,
                    carrier: shipmentData.carrier,
                    shippingAddress: shipmentData.shippingAddress || selectedOrderData?.shippingAddress || null,
                    estimatedDelivery: shipmentData.estimatedDelivery ? new Date(shipmentData.estimatedDelivery).toISOString() : null,
                    status: 'IN_TRANSIT',
                    notes: shipmentData.notes || null,
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create shipment');
            }

            // Redirect to shipments page on success
            router.push('/shipments');
        } catch (error) {
            console.error('Error creating shipment:', error);
            alert(error.message || 'Failed to create shipment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const carriers = [
        'UPS', 'FedEx', 'USPS', 'DHL', 'Canada Post', 'Other'
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/shipments')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Shipments
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Create New Shipment</h1>
                            <p className="text-muted-foreground mt-1">Create a shipment for an existing order</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl">
                        {/* Left Column - Shipment Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center">
                                        <Truck className="h-5 w-5 mr-2" />
                                        Shipment Information
                                    </CardTitle>
                                    <CardDescription>Enter the shipment and tracking details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Order Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Select Order *
                                        </label>
                                        <Select value={selectedOrder} onValueChange={setSelectedOrder} required>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose an order to ship" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {orders.map((order) => (
                                                    <SelectItem key={order.id} value={order.id.toString()}>
                                                        Order #{order.orderId || order.id} - {order.customer?.name} - ${order.total}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Tracking Number */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Tracking Number *
                                            </label>
                                            <Input
                                                type="text"
                                                name="trackingNumber"
                                                value={shipmentData.trackingNumber}
                                                onChange={handleInputChange}
                                                placeholder="Enter tracking number"
                                                required
                                            />
                                        </div>

                                        {/* Carrier */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Carrier *
                                            </label>
                                            <Select
                                                value={shipmentData.carrier}
                                                onValueChange={(value) =>
                                                    setShipmentData(prev => ({ ...prev, carrier: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {carriers.map((carrier) => (
                                                        <SelectItem key={carrier} value={carrier}>
                                                            {carrier}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Shipping Address */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Shipping Address
                                        </label>
                                        <Input
                                            type="text"
                                            name="shippingAddress"
                                            value={shipmentData.shippingAddress}
                                            onChange={handleInputChange}
                                            placeholder={selectedOrderData?.shippingAddress || "Enter shipping address"}
                                        />
                                        {selectedOrderData?.shippingAddress && !shipmentData.shippingAddress && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Default: {selectedOrderData.shippingAddress}
                                            </p>
                                        )}
                                    </div>

                                    {/* Estimated Delivery */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Estimated Delivery Date
                                        </label>
                                        <Input
                                            type="date"
                                            name="estimatedDelivery"
                                            value={shipmentData.estimatedDelivery}
                                            onChange={handleInputChange}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Shipping Notes
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={shipmentData.notes}
                                            onChange={handleInputChange}
                                            placeholder="Add any special shipping instructions or notes..."
                                            className="w-full p-3 border rounded-md min-h-[120px] text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Order Preview */}
                        <div className="space-y-6">
                            {selectedOrderData ? (
                                <>
                                    <Card className="border-0 shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Order Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Order ID</p>
                                                <p className="font-medium">#{selectedOrderData.orderId || selectedOrderData.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Customer</p>
                                                <p className="font-medium">{selectedOrderData.customer?.name}</p>
                                                <p className="text-xs text-muted-foreground">{selectedOrderData.customer?.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Order Total</p>
                                                <p className="font-bold text-lg text-blue-600">${selectedOrderData.total}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-2">Status</p>
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    {selectedOrderData.status}
                                                </Badge>
                                            </div>
                                            {selectedOrderData.shippingAddress && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground flex items-center mb-1">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        Shipping Address
                                                    </p>
                                                    <p className="text-sm">{selectedOrderData.shippingAddress}</p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    <Package className="h-3 w-3 inline mr-1" />
                                                    Order Items
                                                </p>
                                                <div className="space-y-2">
                                                    {selectedOrderData.items?.map((item, index) => (
                                                        <div key={index} className="text-xs p-2 bg-muted rounded">
                                                            <p className="font-medium">{item.product?.name}</p>
                                                            <p className="text-muted-foreground">
                                                                Qty: {item.quantity} × ${item.price}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-sm bg-green-50 dark:bg-green-900/20">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Shipment Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Carrier:</span>
                                                <span className="font-medium">{shipmentData.carrier}</span>
                                            </div>
                                            {shipmentData.trackingNumber && (
                                                <div className="flex justify-between text-sm">
                                                    <span>Tracking:</span>
                                                    <span className="font-mono text-xs">{shipmentData.trackingNumber}</span>
                                                </div>
                                            )}
                                            {shipmentData.estimatedDelivery && (
                                                <div className="flex justify-between text-sm">
                                                    <span>Est. Delivery:</span>
                                                    <span className="font-medium">
                                                        {new Date(shipmentData.estimatedDelivery).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="py-12 text-center text-muted-foreground">
                                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Select an order to view details</p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Actions */}
                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isSubmitting || !selectedOrder || !shipmentData.trackingNumber}
                                >
                                    <Truck className="h-4 w-4 mr-2" />
                                    {isSubmitting ? 'Creating Shipment...' : 'Create Shipment'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.push('/shipments')}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
