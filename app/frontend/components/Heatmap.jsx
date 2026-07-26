import React, { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Circle, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.heat"

function HeatLayer({ points, gradient, max, minOpacity }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    if (points.length > 0) {
      layerRef.current = L.heatLayer(points, { radius: 25, gradient, max, minOpacity }).addTo(map)
    }
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current)
    }
  }, [map, points, gradient, max, minOpacity])

  return null
}

export default function Heatmap({ layers, areas = [], center = [39.5, -98.35], zoom = 4 }) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "28rem", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {layers.filter((layer) => layer.visible).map((layer) => (
        <HeatLayer
          key={layer.name}
          points={layer.points}
          gradient={layer.gradient}
          max={layer.max}
          minOpacity={layer.minOpacity}
        />
      ))}
      {areas.map((area) => (
        <Circle
          key={area.id}
          center={[area.latitude, area.longitude]}
          radius={area.radius_miles * 1609.34}
          pathOptions={{ color: "#1c1917", weight: 2, fillOpacity: 0.05 }}
        >
          <Popup>{area.name} — {area.radius_miles}mi service area</Popup>
        </Circle>
      ))}
    </MapContainer>
  )
}
