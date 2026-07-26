import React, { useEffect, useState } from "react"
import { api } from "../../lib/api"
import Heatmap from "../../components/Heatmap"

export default function AdminHeatmap() {
  const [data, setData] = useState(null)
  const [areas, setAreas] = useState([])
  const [showZipSearches, setShowZipSearches] = useState(true)
  const [showPageViews, setShowPageViews] = useState(true)

  useEffect(() => {
    api.get("/admin/heatmap").then(setData)
    api.get("/admin/service_areas").then((r) => setAreas(r.service_areas))
  }, [])

  if (!data) return <p>Loading…</p>

  const layers = [
    {
      name: "zip_searches",
      points: data.zip_points.map(([lat, lng]) => [lat, lng, 0.5]),
      gradient: { 0.4: "#93c5fd", 0.65: "#3b82f6", 1: "#1d4ed8" },
      visible: showZipSearches,
    },
    {
      name: "page_views",
      points: data.page_view_points.map(([lat, lng]) => [lat, lng, 0.5]),
      gradient: { 0.4: "#fde68a", 0.65: "#f59e0b", 1: "#b45309" },
      visible: showPageViews,
    },
  ]

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Activity heatmap</h1>
      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <input type="checkbox" checked={showZipSearches} onChange={(e) => setShowZipSearches(e.target.checked)} />
          ZIP searches ({data.zip_points.length})
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <input type="checkbox" checked={showPageViews} onChange={(e) => setShowPageViews(e.target.checked)} />
          Page views ({data.page_view_points.length})
        </label>
        <span style={{ color: "var(--stone-500)" }}>Outlined circles show active service areas.</span>
      </div>
      <Heatmap layers={layers} areas={areas} />
    </div>
  )
}
