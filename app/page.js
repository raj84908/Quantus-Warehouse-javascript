"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Truck,
  Plus,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  PackageSearch,
  Receipt
} from "lucide-react"
import { useInventoryStats } from "../hooks/InventoryStats";
import { useState, useEffect } from "react";
import Link from "next/link";


export default function Dashboard() {
  const { stats, loading } = useInventoryStats();
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [todaysShipments, setTodaysShipments] = useState([]);
  const [revenueStats, setRevenueStats] = useState({
    today: 0,
    week: 0,
    month: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE = '';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchRecentOrders(),
        fetchLowStockProducts(),
        fetchPendingPayments(),
        fetchTodaysShipments(),
        fetchRevenueStats()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/orders?limit=5`);
      if (!response.ok) throw new Error('Failed to fetch recent orders');
      const data = await response.json();

      const formattedOrders = (data || []).map(order => ({
        id: order.id,
        orderId: order.orderId,
        customer: order.customer || order.customerName || 'Unknown',
        total: parseFloat(order.total) || 0,
        status: order.status,
        priority: order.priority,
        date: new Date(order.createdAt).toLocaleDateString(),
        itemCount: order.items?.length || 0
      }));

      setRecentOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setRecentOrders([]);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      // Filter for low stock and out of stock items
      const lowStock = (data || [])
        .filter(p => p.status === 'LOW_STOCK' || p.status === 'OUT_OF_STOCK')
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          status: p.status,
          value: p.value || 0
        }));

      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      setLowStockProducts([]);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/payments/list?timeRange=30`);
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();

      // Filter for partial and pending payments
      const pending = (data || [])
        .filter(p => p.status === 'Partial' || p.status === 'Pending')
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          orderId: p.orderId,
          customer: p.customer,
          total: p.total,
          balance: p.balance,
          status: p.status
        }));

      setPendingPayments(pending);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setPendingPayments([]);
    }
  };

  const fetchTodaysShipments = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const response = await fetch(`${API_BASE}/api/shipments?start=${startOfDay}&end=${endOfDay}`);
      if (!response.ok) throw new Error('Failed to fetch shipments');
      const data = await response.json();

      const formatted = (data || []).slice(0, 5).map(s => ({
        id: s.id,
        orderId: s.orderId,
        carrier: s.carrier,
        status: s.status,
        destination: s.destination
      }));

      setTodaysShipments(formatted);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setTodaysShipments([]);
    }
  };

  const fetchRevenueStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/dashboard/revenue`);
      if (!response.ok) throw new Error('Failed to fetch revenue stats');
      const data = await response.json();
      setRevenueStats(data);
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const quickActions = [
    { label: "New Order", icon: Plus, href: "/orders/new", color: "bg-blue-500 hover:bg-blue-600" },
    { label: "Add Product", icon: Package, href: "/inventory/add", color: "bg-emerald-500 hover:bg-emerald-600" },
    { label: "Create Shipment", icon: Truck, href: "/shipments/new", color: "bg-violet-500 hover:bg-violet-600" },
    { label: "View Reports", icon: FileText, href: "/reports", color: "bg-amber-500 hover:bg-amber-600" },
  ];

  const statistics = [
    {
      title: "Today's Revenue",
      value: formatCurrency(revenueStats.today),
      subtitle: `This week: ${formatCurrency(revenueStats.week)}`,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Pending Orders",
      value: recentOrders.filter(o => o.status === 'PENDING' || o.status === 'Processing').length,
      subtitle: `${recentOrders.length} total recent`,
      icon: ShoppingCart,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Low Stock Alerts",
      value: lowStockProducts.length,
      subtitle: "Need immediate attention",
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20"
    },
    {
      title: "Pending Payments",
      value: pendingPayments.length,
      subtitle: formatCurrency(pendingPayments.reduce((sum, p) => sum + p.balance, 0)),
      icon: Receipt,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20"
    }
  ];

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} href={action.href}>
                  <Button className={`w-full h-20 ${action.color} text-white`}>
                    <div className="flex flex-col items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statistics.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="border-0 shadow-sm dark:bg-gray-800/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Low Stock Alerts */}
          <Card className="border-0 shadow-sm dark:bg-gray-800/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Low Stock Alerts
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Products that need restocking
                  </CardDescription>
                </div>
                <Link href="/inventory">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                  <p className="text-sm">All products are well stocked!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge className={product.status === 'OUT_OF_STOCK'
                          ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200'
                          : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200'
                        }>
                          {product.stock} left
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Payments */}
          <Card className="border-0 shadow-sm dark:bg-gray-800/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-red-600" />
                    Pending Payments
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                    Outstanding customer balances
                  </CardDescription>
                </div>
                <Link href="/payments">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {pendingPayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                  <p className="text-sm">No pending payments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{payment.orderId}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{payment.customer}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-red-600 dark:text-red-400 text-sm">{formatCurrency(payment.balance)}</p>
                        <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Shipments */}
        <Card className="mb-6 border-0 shadow-sm dark:bg-gray-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-purple-600" />
                  Today's Shipments
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                  Packages scheduled for today
                </CardDescription>
              </div>
              <Link href="/shipments">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {todaysShipments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Truck className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No shipments scheduled for today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {todaysShipments.map((shipment) => (
                  <div key={shipment.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">{shipment.orderId}</span>
                      <Badge className="text-xs">{shipment.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Carrier: {shipment.carrier}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{shipment.destination}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-0 shadow-sm dark:bg-gray-800/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Recent Orders
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                  Latest orders from customers
                </CardDescription>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No recent orders</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order ID</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Items</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <Link href={`/orders/${order.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-sm">
                            {order.orderId}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">{order.customer}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{order.itemCount} items</td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white text-sm">{formatCurrency(order.total)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={
                            order.status === "Completed"
                              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          }>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={
                            order.priority === "High"
                              ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                              : order.priority === "Medium"
                              ? "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }>
                            {order.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
