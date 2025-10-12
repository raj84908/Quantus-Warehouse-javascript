"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Component to update map view when selected shipment changes
function MapUpdater({ selectedShipment }) {
    const map = useMap()
    useEffect(() => {
        if (selectedShipment) {
            map.flyTo([selectedShipment.lat, selectedShipment.lng], 12, { duration: 1.5 })
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

    // Custom animated package icon - modern design
    const createPackageIcon = (isSelected, status) => {
        const color = status === "Delivered" ? "#10b981" : status === "In Transit" ? "#3b82f6" : "#f59e0b"
        const size = isSelected ? 48 : 36

        return L.divIcon({
            html: `
                <div style="
                    position: relative;
                    width: ${size}px;
                    height: ${size}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: ${isSelected ? 'pulse 2s ease-in-out infinite' : 'bounce 1s ease-in-out infinite'};
                ">
                    ${isSelected ? `
                        <div style="
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            background: ${color}20;
                            border-radius: 50%;
                            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                        "></div>
                    ` : ''}
                    <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="24" height="24" rx="4" fill="${color}"/>
                        <path d="M12 3L4 7V12L12 16L20 12V7L12 3Z" fill="white" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 16V21" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                        <path d="M4 7L12 11L20 7" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <style>
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.1); opacity: 0.9; }
                    }
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-4px); }
                    }
                    @keyframes ping {
                        75%, 100% { transform: scale(2); opacity: 0; }
                    }
                </style>
            `,
            className: '',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2],
        })
    }

    const defaultCenter = [39.8283, -98.5795] // US center coordinates

    // Get warehouse origin (could be dynamic)
    const warehouseLocation = [39.8283, -98.5795]

    return (
        <div className="w-full h-96 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
            <MapContainer
                center={defaultCenter}
                zoom={4}
                style={{ height: "100%", width: "100%" }}
                zoomControl={true}
            >
                {/* Modern map tiles - using CartoDB Positron for clean look */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <MapUpdater selectedShipment={selectedShipment} />

                {/* Package markers */}
                {shipments.map((shipment) => (
                    <Marker
                        key={shipment.id}
                        position={[shipment.lat, shipment.lng]}
                        icon={createPackageIcon(selectedShipment?.id === shipment.id, shipment.status)}
                        eventHandlers={{
                            click: () => onSelectShipment(shipment),
                        }}
                    >
                        <Popup className="custom-popup" maxWidth={300}>
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-lg text-gray-900">{shipment.customer}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        shipment.status === "Delivered" ? "bg-green-100 text-green-800" :
                                        shipment.status === "In Transit" ? "bg-blue-100 text-blue-800" :
                                        "bg-orange-100 text-orange-800"
                                    }`}>
                                        {shipment.status}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="text-gray-700">{shipment.destination}</span>
                                    </div>
                                    <div className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-gray-700">ETA: {shipment.estDelivery}</span>
                                    </div>
                                    <div className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span className="text-gray-700 font-mono text-xs">{shipment.trackingNumber}</span>
                                    </div>
                                    <div className="flex items-start">
                                        <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <span className="text-gray-700">{shipment.items} • {shipment.weight}</span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            <style jsx global>{`
                .custom-popup .leaflet-popup-content-wrapper {
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                }
                .custom-popup .leaflet-popup-tip {
                    box-shadow: 0 3px 14px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    )
}

export default TrackingMap
