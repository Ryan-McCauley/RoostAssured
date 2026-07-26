import React, { useEffect } from "react"
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"

function RecenterOnPin({ pin }) {
  const map = useMap()
  useEffect(() => {
    if (pin) map.setView([pin.latitude, pin.longitude], Math.max(map.getZoom(), 9))
  }, [map, pin?.latitude, pin?.longitude])
  return null
}

export default function ServiceAreaMap({ areas, pin, radiusMiles, center = [39.5, -98.35], zoom = 4 }) {
  return (
    <MapContainer center={pin ? [pin.latitude, pin.longitude] : center} zoom={pin ? 9 : zoom} style={{ height: "24rem", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {areas.map((area) => (
        <React.Fragment key={area.id}>
          <Circle center={[area.latitude, area.longitude]} radius={area.radius_miles * 1609.34} pathOptions={{ color: "#78716c" }} />
          <Marker position={[area.latitude, area.longitude]}>
            <Popup>{area.name}</Popup>
          </Marker>
        </React.Fragment>
      ))}
      {pin && (
        <>
          <Circle center={[pin.latitude, pin.longitude]} radius={(radiusMiles || 10) * 1609.34} pathOptions={{ color: "#d97706" }} />
          <Marker position={[pin.latitude, pin.longitude]} />
          <RecenterOnPin pin={pin} />
        </>
      )}
    </MapContainer>
  )
}
