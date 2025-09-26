"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Component to update map view when selected shipment changes
function MapUpdater({ selectedShipment }) {
    const map = useMap()
    useEffect(() => {
        if (selectedShipment) {
            map.flyTo([selectedShipment.lat, selectedShipment.lng], 10, { duration: 1.5 })
        } else {
            // Optionally reset to default center or zoom out when no shipment selected
            map.flyTo([39.8283, -98.5795], 4, { duration: 1.5 }) // US center zoomed out
        }
    }, [selectedShipment, map])
    return null
}

const TrackingMap = ({ shipments, selectedShipment, onSelectShipment }) => {
    // Initialize Leaflet icon URLs (fix for Next.js SSR)
    useEffect(() => {
        if (typeof window !== "undefined") {
            delete L.Icon.Default.prototype._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
                iconUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
                shadowUrl:
                    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
            })
        }
    }, [])

    // Custom truck icon for shipments
    const truckIcon = new L.Icon({
        iconUrl:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgMTJIMTlNMTUgMTZIMTlNMTUgOEgxOU0zIDVIMjFWN0gyMFYxN0gyMVYxOUgyMFYxN0g0VjE5SDNWNUg0VjE1SDNWNUg0TTQgMTVIMjBNMTYgMTVWMTlIMTZWMTVNMTAgMTlWMTVIMTBWMTlNOCAxOVYxNUg4VjE5TTYgMTlWMTVINlYxOU00IDE1VjEwSDIwVjE1TTQgMTBWN0gyMFYxMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+",
        iconSize: [25, 25],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    })

    const defaultCenter = [39.8283, -98.5795] // US center coordinates

    return (
        <div className="w-full h-96 rounded-lg border border-gray-200 overflow-hidden">
            <MapContainer center={defaultCenter} zoom={4} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater selectedShipment={selectedShipment} />

                {shipments.map((shipment) => (
                    <Marker
                        key={shipment.id}
                        position={[shipment.lat, shipment.lng]}
                        icon={selectedShipment?.id === shipment.id ? undefined : truckIcon} // Default icon if selected else truck icon
                        eventHandlers={{
                            click: () => onSelectShipment(shipment),
                        }}
                    >
                        <Popup>
                            <div className="p-2">
                                <p className="font-semibold">{shipment.customer}</p>
                                <p className="text-sm">Status: {shipment.status}</p>
                                <p className="text-sm">ETA: {shipment.estDelivery}</p>
                                <p className="text-sm">Destination: {shipment.destination}</p>
                                <p className="text-sm">Tracking #: {shipment.trackingNumber}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}

export default TrackingMap
