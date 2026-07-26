import React from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"

export default function RequestLocationMap({ latitude, longitude, label }) {
  if (!latitude || !longitude) {
    return (
      <div style={{ height: "12rem", width: "100%", borderRadius: "0.6rem", background: "var(--field-bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Location not available
      </div>
    )
  }

  return (
    <MapContainer
      center={[latitude, longitude]} zoom={13} style={{ height: "12rem", width: "100%", borderRadius: "0.6rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <Marker position={[latitude, longitude]}>
        {label && <Popup>{label}</Popup>}
      </Marker>
    </MapContainer>
  )
}
