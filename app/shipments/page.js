"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
const TrackingMap = dynamic(
    () => import("./TrackingMap").then((mod) => mod.default),
    { ssr: false }
)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Filter, Download, Plus, Truck, MapPin, X } from "lucide-react"

// Leaflet imports
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([
    {
      id: 1,
      shipmentId: "SHP-001247",
      orderId: "ORD-12847",
      customer: "Acme Corp",
      destination: "New York, NY",
      carrier: "FedEx",
      trackingNumber: "123456789123",
      status: "In Transit",
      items: "25 items",
      weight: "45.2 lbs",
      estDelivery: "Dec 29, 2024",
      lat: 40.7128,
      lng: -74.0060,
    },
    {
      id: 2,
      shipmentId: "SHP-001246",
      orderId: "ORD-12846",
      customer: "TechStart Inc",
      destination: "San Francisco, CA",
      carrier: "UPS",
      trackingNumber: "987654321987",
      status: "Delivered",
      items: "12 items",
      weight: "23.8 lbs",
      estDelivery: "Dec 28, 2024",
      lat: 37.7749,
      lng: -122.4194,
    },
    {
      id: 3,
      shipmentId: "SHP-001245",
      orderId: "ORD-12845",
      customer: "Global Solutions",
      destination: "Chicago, IL",
      carrier: "DHL",
      trackingNumber: "555666777778",
      status: "Preparing",
      items: "8 items",
      weight: "12.5 lbs",
      estDelivery: "Dec 30, 2024",
      lat: 41.8781,
      lng: -87.6298,
    },
  ])

  const [selectedShipment, setSelectedShipment] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newShipment, setNewShipment] = useState({
    customer: "",
    destination: "",
    carrier: "",
    trackingNumber: "",
    status: "Preparing",
    items: "",
    weight: "",
    estDelivery: "",
  })

  // Fix for Leaflet z-index issue with dialogs
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-container { z-index: 1; }
      .leaflet-pane { z-index: 1; }
      .leaflet-top, .leaflet-bottom { z-index: 1; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "In Transit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Preparing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "Out for Delivery":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const handleAddShipment = () => {
    // Basic validation
    if (!newShipment.customer || !newShipment.destination || !newShipment.carrier) {
      alert("Please fill in required fields: Customer, Destination, and Carrier")
      return
    }

    const newId = shipments.length > 0 ? Math.max(...shipments.map(s => s.id)) + 1 : 1

    // Generate coordinates based on destination (simplified for demo)
    const getCoordinates = (destination) => {
      // In a real app, you would use a geocoding service here
      const cityCoords = {
        "New York, NY": { lat: 40.7128, lng: -74.0060 },
        "San Francisco, CA": { lat: 37.7749, lng: -122.4194 },
        "Chicago, IL": { lat: 41.8781, lng: -87.6298 },
        "Austin, TX": { lat: 30.2672, lng: -97.7431 },
        "Miami, FL": { lat: 25.7617, lng: -80.1918 },
        "Seattle, WA": { lat: 47.6062, lng: -122.3321 },
        "Boston, MA": { lat: 42.3601, lng: -71.0589 },
        "Los Angeles, CA": { lat: 34.0522, lng: -118.2437 },
      }

      return cityCoords[destination] || {
        lat: 39.8283 + (Math.random() - 0.5) * 10,
        lng: -98.5795 + (Math.random() - 0.5) * 10
      }
    }

    const coords = getCoordinates(newShipment.destination)

    const newShipmentWithId = {
      ...newShipment,
      id: newId,
      shipmentId: `SHP-${String(newId).padStart(6, '0')}`,
      orderId: `ORD-${String(10000 + newId).padStart(5, '0')}`,
      lat: coords.lat,
      lng: coords.lng,
    }

    setShipments([...shipments, newShipmentWithId])
    setNewShipment({
      customer: "",
      destination: "",
      carrier: "",
      trackingNumber: "",
      status: "Preparing",
      items: "",
      weight: "",
      estDelivery: "",
    })
    setIsAddDialogOpen(false)
  }

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
        shipment.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Shipment Tracking</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and track all outbound shipments</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Shipment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] z-50">
                  <DialogHeader>
                    <DialogTitle>Add New Shipment</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="customer" className="text-right">
                        Customer *
                      </Label>
                      <Input
                          id="customer"
                          value={newShipment.customer}
                          onChange={(e) => setNewShipment({...newShipment, customer: e.target.value})}
                          className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="destination" className="text-right">
                        Destination *
                      </Label>
                      <Select
                          value={newShipment.destination}
                          onValueChange={(value) => setNewShipment({...newShipment, destination: value})}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New York, NY">New York, NY</SelectItem>
                          <SelectItem value="San Francisco, CA">San Francisco, CA</SelectItem>
                          <SelectItem value="Chicago, IL">Chicago, IL</SelectItem>
                          <SelectItem value="Austin, TX">Austin, TX</SelectItem>
                          <SelectItem value="Miami, FL">Miami, FL</SelectItem>
                          <SelectItem value="Seattle, WA">Seattle, WA</SelectItem>
                          <SelectItem value="Boston, MA">Boston, MA</SelectItem>
                          <SelectItem value="Los Angeles, CA">Los Angeles, CA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="carrier" className="text-right">
                        Carrier *
                      </Label>
                      <Select
                          value={newShipment.carrier}
                          onValueChange={(value) => setNewShipment({...newShipment, carrier: value})}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FedEx">FedEx</SelectItem>
                          <SelectItem value="UPS">UPS</SelectItem>
                          <SelectItem value="DHL">DHL</SelectItem>
                          <SelectItem value="USPS">USPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="trackingNumber" className="text-right">
                        Tracking #
                      </Label>
                      <Input
                          id="trackingNumber"
                          value={newShipment.trackingNumber}
                          onChange={(e) => setNewShipment({...newShipment, trackingNumber: e.target.value})}
                          className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="status" className="text-right">
                        Status
                      </Label>
                      <Select
                          value={newShipment.status}
                          onValueChange={(value) => setNewShipment({...newShipment, status: value})}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Preparing">Preparing</SelectItem>
                          <SelectItem value="In Transit">In Transit</SelectItem>
                          <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                          <SelectItem value="Delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="items" className="text-right">
                        Items
                      </Label>
                      <Input
                          id="items"
                          value={newShipment.items}
                          onChange={(e) => setNewShipment({...newShipment, items: e.target.value})}
                          className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="weight" className="text-right">
                        Weight
                      </Label>
                      <Input
                          id="weight"
                          value={newShipment.weight}
                          onChange={(e) => setNewShipment({...newShipment, weight: e.target.value})}
                          className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="estDelivery" className="text-right">
                        Est. Delivery
                      </Label>
                      <Input
                          id="estDelivery"
                          type="date"
                          value={newShipment.estDelivery}
                          onChange={(e) => setNewShipment({...newShipment, estDelivery: e.target.value})}
                          className="col-span-3"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleAddShipment}>Add Shipment</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Package Locations with Map */}
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Package Locations</CardTitle>
              <CardDescription className="dark:text-gray-400">Real-time tracking map</CardDescription>
            </CardHeader>
            <CardContent>
              <TrackingMap
                  shipments={shipments}
                  selectedShipment={selectedShipment}
                  onSelectShipment={setSelectedShipment}
              />
            </CardContent>
          </Card>

          {/* Quick Track */}
          <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100">Quick Track</CardTitle>
              <CardDescription className="dark:text-gray-400">Enter tracking number...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input placeholder="Enter tracking number" className="flex-1" />
                <Button>Track</Button>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2 dark:text-gray-300">Status Legend</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm dark:text-gray-400">Delivered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm dark:text-gray-400">In Transit</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span className="text-sm dark:text-gray-400">Pending</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm dark:text-gray-400">Exception</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipments Table */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="dark:text-gray-100">Shipments</CardTitle>
                  <CardDescription className="dark:text-gray-400">
                    Track and manage all warehouse shipments
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                      placeholder="Search shipments..."
                      className="pl-10 dark:bg-gray-700 dark:text-gray-50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 dark:bg-gray-700 dark:text-gray-50">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:text-gray-50">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Preparing">Preparing</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Shipment ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Destination</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Carrier</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Tracking Number
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Items</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Weight</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Est. Delivery</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filteredShipments.map((shipment) => (
                      <tr
                          key={shipment.id}
                          className={`border-b hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedShipment?.id === shipment.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                          onClick={() => setSelectedShipment(shipment)}
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{shipment.shipmentId}</td>
                        <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">{shipment.orderId}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{shipment.customer}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.destination}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.carrier}</td>
                        <td className="py-3 px-4 font-mono text-sm text-blue-600 dark:text-blue-400">
                          {shipment.trackingNumber}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.items}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.weight}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.estDelivery}</td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline">
                            •••
                          </Button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>

                {filteredShipments.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No shipments found. <Button variant="link" onClick={() => setIsAddDialogOpen(true)}>Add a shipment</Button>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}