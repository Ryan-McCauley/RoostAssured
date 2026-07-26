import React, { useEffect, useState } from "react"
import { api } from "../../lib/api"
import ServiceAreaMap from "../../components/ServiceAreaMap"

export default function ServiceAreas() {
  const [areas, setAreas] = useState(null)
  const [form, setForm] = useState({ name: "", latitude: "", longitude: "", radius_miles: 10 })
  const [address, setAddress] = useState("")
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState(null)

  const load = () => api.get("/admin/service_areas").then((r) => setAreas(r.service_areas))
  useEffect(() => { load() }, [])

  const pin = form.latitude !== "" && form.longitude !== ""
    ? { latitude: Number(form.latitude), longitude: Number(form.longitude) }
    : null

  const handleGeocode = async (e) => {
    e.preventDefault()
    if (!address.trim()) return
    setGeocoding(true)
    setError(null)
    try {
      const result = await api.get(`/admin/service_areas/geocode?q=${encodeURIComponent(address)}`)
      setForm({ ...form, latitude: result.latitude, longitude: result.longitude })
    } catch (err) {
      setError(err.data?.error || "Couldn't find that location.")
    } finally {
      setGeocoding(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const result = await api.post("/admin/service_areas", { service_area: form })
      setAreas(result.service_areas)
      setForm({ name: "", latitude: "", longitude: "", radius_miles: 10 })
      setAddress("")
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Something went wrong.")
    }
  }

  const remove = async (id) => {
    const result = await api.delete(`/admin/service_areas/${id}`)
    setAreas(result.service_areas)
  }

  if (!areas) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Service areas</h1>
      <ul>
        {areas.map((a) => (
          <li key={a.id}>
            {a.name} ({a.latitude}, {a.longitude}) — {a.radius_miles}mi{" "}
            <button onClick={() => remove(a.id)} style={{ background: "transparent", border: 0, color: "var(--amber-700)", textDecoration: "underline", cursor: "pointer" }}>Remove</button>
          </li>
        ))}
      </ul>
      {error && <p className="flash flash-alert">{error}</p>}

      <div style={{ marginTop: "1rem", marginBottom: "0.75rem" }}>
        <ServiceAreaMap areas={areas} pin={pin} radiusMiles={form.radius_miles} />
      </div>

      <form onSubmit={handleGeocode} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          placeholder="Search an address to place the pin…"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-outline" disabled={geocoding}>
          {geocoding ? "Searching…" : "Search"}
        </button>
      </form>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
        <input placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
        <input placeholder="Radius (mi)" type="number" value={form.radius_miles} onChange={(e) => setForm({ ...form, radius_miles: e.target.value })} required />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>
      <p style={{ fontSize: "0.8rem", color: "var(--stone-500)", marginTop: "0.5rem" }}>
        Search an address above to preview the pin, then fill in the fields below.
      </p>
    </div>
  )
}
