"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const TrackingMap = ({ shipments, selectedShipment, onSelectShipment }) => {
    // Initialize Leaflet icons safely on client
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

    const truckIcon = new L.Icon({
        iconUrl:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgMTJIMTlNMTUgMTZIMTlNMTUgOEgxOU0zIDVIMjFWN0gyMFYxN0gyMVYxOUgyMFYxN0g0VjE5SDNWNUg0VjE1SDNWNUg0TTQgMTVIMjBNMTYgMTVWMTlIMTZWMTVNMTAgMTlWMTVIMTBWMTlNOCAxOVYxNUg4VjE5TTYgMTlWMTVINlYxOU00IDE1VjEwSDIwVjE1TTQgMTBWN0gyMFYxMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+",
        iconSize: [25, 25],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    })

    const defaultCenter = [39.8283, -98.5795] // Center of US

    return (
        <div className="w-full h-96 rounded-lg border border-gray-200 overflow-hidden">
            <MapContainer center={defaultCenter} zoom={4} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {shipments.map((shipment) => (
                    <Marker
                        key={shipment.id}
                        position={[shipment.lat, shipment.lng]}
                        icon={selectedShipment?.id === shipment.id ? undefined : truckIcon}
                        eventHandlers={{
                            click: () => onSelectShipment(shipment),
                        }}
                    >
                        <Popup>
                            <div className="p-2">
                                <p className="font-semibold">{shipment.customer}</p>
                                <p className="text-sm">Status: {shipment.status}</p>
                                <p className="text-sm">ETA: {shipment.estDelivery}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}

export default TrackingMap
