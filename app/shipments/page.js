"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
import { Search, Filter, Download, Plus } from "lucide-react"

// Leaflet imports
import "leaflet/dist/leaflet.css"

const TrackingMap = dynamic(
    () => import("./TrackingMap").then((mod) => mod.default),
    { ssr: false }
)

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
  const [trackingNumberInput, setTrackingNumberInput] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Leaflet z-index fix for dialogs
  useEffect(() => {
    const style = document.createElement("style")
    style.innerHTML = `
      .leaflet-container { z-index: 1; }
      .leaflet-pane { z-index: 1; }
      .leaflet-top, .leaflet-bottom { z-index: 1; }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

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

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
        shipment.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Handle tracking number search and select shipment
  const handleTrackPackage = () => {
    const shipment = shipments.find(
        (s) =>
            s.trackingNumber.toLowerCase() === trackingNumberInput.toLowerCase() ||
            s.shipmentId.toLowerCase() === trackingNumberInput.toLowerCase()
    )
    if (shipment) {
      setSelectedShipment(shipment)
      setSearchTerm("") // Reset other searches
      setStatusFilter("all")
    } else {
      alert("Shipment not found with that tracking number or shipment ID.")
      setSelectedShipment(null)
    }
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Shipment Tracking</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and track all outbound shipments</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Add Shipment
              </Button>
            </div>
          </div>

          {/* Tracking Number Search */}
          <div className="mb-4 flex items-center space-x-3">
            <Input
                placeholder="Enter tracking number or shipment ID"
                value={trackingNumberInput}
                onChange={(e) => setTrackingNumberInput(e.target.value)}
                className="max-w-xs"
            />
            <Button onClick={handleTrackPackage} disabled={!trackingNumberInput.trim()}>
              Track Package
            </Button>
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
                <Button variant="outline" size="sm" disabled>
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">Tracking Number</th>
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
                          className={`border-b cursor-pointer ${
                              selectedShipment?.id === shipment.id
                                  ? "bg-blue-100 dark:bg-blue-900"
                                  : "bg-gray-100/50 dark:bg-gray-700/50"
                          }`}
                          onClick={() => setSelectedShipment(shipment)}
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{shipment.shipmentId}</td>
                        <td className="py-3 px-4 font-medium text-blue-600 dark:text-blue-400">{shipment.orderId}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{shipment.customer}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.destination}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.carrier}</td>
                        <td className="py-3 px-4 font-mono text-sm text-blue-600 dark:text-blue-400">{shipment.trackingNumber}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(shipment.status)}>{shipment.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.items}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.weight}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{shipment.estDelivery}</td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline" disabled>
                            •••
                          </Button>
                        </td>
                      </tr>
                  ))}
                  {filteredShipments.length === 0 && (
                      <tr>
                        <td colSpan={11} className="text-center py-6 text-gray-500 dark:text-gray-400">
                          No shipments found.
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  )
}
