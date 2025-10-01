"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, DollarSign, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react"
import { useInventoryStats } from "../hooks/InventoryStats";
import { useState, useEffect } from "react";
import Link from "next/link";


export default function Dashboard() {
  const { inventoryItems, stats, loading, refresh } = useInventoryStats();
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [ordersToday, setOrdersToday] = useState(0);
  const API_BASE = '';
  // Fetch recent stock adjustments when component mounts
  useEffect(() => {
    fetchRecentActivity();
  }, []);
  useEffect(() => {
    fetchRecentOrders();
  }, [])

  useEffect(() => {
    fetchOrdersToday();
  }, []);

  const fetchOrdersToday = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const res = await fetch(`${API_BASE}/api/orders?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
      if (!res.ok) throw new Error("Failed to fetch today's orders");
      const data = await res.json();
      setOrdersToday(data.length);
    } catch (err) {
      console.error(err);
      setOrdersToday(0);
    }
  };

  // Function to fetch recent stock adjustments
  const fetchRecentActivity = async () => {
    setIsLoading(true);
    try {
      // Fetch the 5 most recent stock adjustments
      const response = await fetch(`${API_BASE}/api/stock-adjustments?limit=5`);
      if (!response.ok) throw new Error('Failed to fetch recent activity');

      const data = await response.json();

      // Transform the data for display
      const formattedActivity = data.map(adjustment => {
        const timeAgo = getTimeAgo(new Date(adjustment.createdAt));
        const isAddition = adjustment.quantity > 0;

        const productName = adjustment.product?.name || "Unknown Product";

        return {
          type: isAddition ? "stock-add" : "stock-remove",
          title: isAddition ? "Stock added" : "Stock removed",
          description: `${productName} - ${Math.abs(adjustment.quantity)} units ${isAddition ? 'added' : 'removed'}`,
          reason: adjustment.reason,
          time: timeAgo,
          color: isAddition
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          icon: isAddition ? ArrowUp : ArrowDown,
        };
      });


      setRecentActivity(formattedActivity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Just clear if there’s an error
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchRecentOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders?limit=5`);
      if (!response.ok) throw new Error('Failed to fetch recent orders');
      const data = await response.json();

      // Check if data exists and is an array with items
      if (!data || !Array.isArray(data) || data.length === 0) {
        setRecentOrders([]);
        return;
      }

      const formattedOrders = data.map(order => ({
        orderId: order.orderId,
        customer: order.customer,
        items: `${order.items.length} items`,
        status: order.status,
        priority: order.priority,
        date: new Date(order.createdAt).toLocaleDateString(),
      }));

      setRecentOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setRecentOrders([]);
    } finally {
      setIsOrdersLoading(false);
    }
  };


  // Helper function to format time differences
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString();
  };

  const statistics = [
    {
      title: "Total Items",
      value: stats.totalItems || 0,
      //change: stats.totalChangePct ? `${stats.totalChangePct}%` : "+0%",
      //changeText: "from last month",
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStock || 0,
      //change: stats.lowStockChange ? `${stats.lowStockChange} items` : "+0 items",
      //changeText: "need restocking",
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      title: "Orders Today",
      value: ordersToday || 0,
      //change: stats.ordersChangePct ? `${stats.ordersChangePct}%` : "+0%",
      //changeText: "from yesterday",
      icon: ShoppingCart,
      color: "text-green-600"
    },
    {
      title: "Warehouse Value",
      value: `$${stats.totalValue?.toLocaleString() || 0}`,
      //change: stats.valueChangePct ? `${stats.valueChangePct}%` : "0%",
      //changeText: "from last month",
      icon: DollarSign,
      color: "text-purple-600"
    }
  ];
  

  return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          </div>

          {/* STATISTICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statistics.map((stat, i) => {
              const Icon = stat.icon;
              return (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                      </p>
                    </CardContent>
                  </Card>
              );
            })}
          </div>

          {/* RECENT ACTIVITY CARD - NOW FULL WIDTH */}
          <div className="mb-8">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest inventory movements and updates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="mx-auto h-12 w-12 opacity-30 mb-2" />
                      <p>No recent inventory activity</p>
                      <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={fetchRecentActivity}
                      >
                        Refresh
                      </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recentActivity.slice(0, 6).map((activity, index) => (
                          <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div
                                className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${activity.color.split(" ")[0]} ${activity.color.split(" ")[1]} dark:${activity.color.split(" ")[3]} dark:${activity.color.split(" ")[4]}`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                              {activity.reason && (
                                  <Badge variant="outline" className="mt-2 text-xs">
                                    Reason: {activity.reason}
                                  </Badge>
                              )}
                              <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                            </div>
                          </div>
                      ))}
                    </div>
                )}
                {!isLoading && recentActivity.length > 0 && (
                    <div className="pt-4 text-right border-t mt-6">
                      <Link href="/inventory/adjustments">
                        <Button variant="link" size="sm" className="text-sm">
                          View all activity
                        </Button>
                      </Link>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                {isOrdersLoading
                    ? <div className="flex justify-center items-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    : recentOrders.length === 0
                        ? <p className="text-center text-muted-foreground py-8">No recent orders</p>
                        : <table className="w-full">
                          <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-foreground">Order ID</th>
                            <th className="text-left py-3 px-4 font-medium text-foreground">Customer</th>
                            <th className="text-left py-3 px-4 font-medium text-foreground">Items</th>
                            <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-foreground">Priority</th>
                            <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                          </tr>
                          </thead>
                          <tbody>
                          {recentOrders.map((order,i) => (
                              <tr key={i} className="border-b hover:bg-muted/50">
                                <td className="py-3 px-4 font-medium text-primary">{order.orderId}</td>
                                <td className="py-3 px-4 text-foreground">{order.customer}</td>
                                <td className="py-3 px-4 text-muted-foreground">{order.items}</td>
                                <td className="py-3 px-4">
                                  <Badge className={order.status === "Processing" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"}>
                                    {order.status}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4">
                                  <Badge className={order.priority === "High" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"}>
                                    {order.priority}
                                  </Badge>
                                </td>
                                <td className="py-3 px-4 text-muted-foreground">{order.date}</td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}