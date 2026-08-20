import React, { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../lib/api"

const iconProps = {
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round",
}

const CARE_TYPES = [
  {
    key: "sitting",
    title: "Chicken Sitting",
    available: true,
    icon: (
      <svg {...iconProps}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></svg>
    ),
  },
  {
    key: "coop_care",
    title: "Coop Care",
    available: true,
    icon: (
      <svg {...iconProps}><path d="M4 21v-6a8 8 0 0 1 16 0v6" /><path d="M4 21h16" /><path d="M9 21v-4a3 3 0 0 1 6 0v4" /></svg>
    ),
  },
]

export default function ZipSearchForm({ onSuccess }) {
  const [careType, setCareType] = useState("sitting")
  const [form, setForm] = useState({ city: "", state: "", zip_code: "" })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post("/zip_search", form)
      onSuccess && onSuccess()
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: "40rem", margin: "0 auto", textAlign: "left" }}>
      <div className="hero-search-card">
        <p className="hero-search-label">What kind of care are you looking for?</p>
        <div className="hero-care-tiles">
          {CARE_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              className={`hero-care-tile${careType === type.key ? " selected" : ""}`}
              aria-pressed={careType === type.key}
              disabled={!type.available}
              onClick={() => type.available && setCareType(type.key)}
              title={type.available ? type.title : `${type.title} — coming soon`}
            >
              {type.icon}
              <span>{type.title}</span>
              {!type.available && <span className="hero-care-tile-badge">Soon</span>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="hero-address-row">
          {error && <p className="flash flash-alert" style={{ borderRadius: "0.5rem", marginBottom: "0.75rem" }}>{error}</p>}
          <div className="hero-address-fields">
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="hero-city">City</label>
              <input id="hero-city" name="city" value={form.city} onChange={handleChange} required autoComplete="address-level2" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="hero-state">State</label>
              <input id="hero-state" name="state" value={form.state} onChange={handleChange} required maxLength={2} placeholder="CA" autoComplete="address-level1" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="hero-zip">ZIP code</label>
              <input id="hero-zip" name="zip_code" value={form.zip_code} onChange={handleChange} required pattern="\d{5}" autoComplete="postal-code" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary hero-search-btn" disabled={submitting}>
            {submitting ? "Searching…" : "Search"}
          </button>
        </form>
      </div>

      <div className="hero-teaser-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span className="hero-teaser-icon">
            <svg width="26" height="22" viewBox="0 0 28 24" fill="currentColor">
              <path d="M0,-6.2 C-3.6,-6.2 -4.6,-1.5 -4.4,1.3 C-4.2,4.6 -2.3,6.2 0,6.2 C2.3,6.2 4.2,4.6 4.4,1.3 C4.6,-1.5 3.6,-6.2 0,-6.2 Z" opacity="0.45" transform="translate(9.5,10) rotate(-20) scale(0.62)" />
              <path d="M0,-6.2 C-3.6,-6.2 -4.6,-1.5 -4.4,1.3 C-4.2,4.6 -2.3,6.2 0,6.2 C2.3,6.2 4.2,4.6 4.4,1.3 C4.6,-1.5 3.6,-6.2 0,-6.2 Z" opacity="0.45" transform="translate(18.5,10) rotate(20) scale(0.62)" />
              <path d="M0,-6.2 C-3.6,-6.2 -4.6,-1.5 -4.4,1.3 C-4.2,4.6 -2.3,6.2 0,6.2 C2.3,6.2 4.2,4.6 4.4,1.3 C4.6,-1.5 3.6,-6.2 0,-6.2 Z" transform="translate(14,15) scale(0.84)" />
            </svg>
          </span>
          <span>
            <Link
              to="/become-a-sitter"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "var(--brand-dark)", textDecoration: "none" }}
            >
              Become a Sitter
              <span className="hero-teaser-badge">NEW</span>
            </Link>
            <span style={{ fontSize: "0.85rem", color: "var(--stone-600)" }}>Earn money caring for flocks near you</span>
          </span>
        </div>
        <Link to="/become-a-sitter" className="btn btn-outline hero-teaser-btn">Learn more</Link>
      </div>
    </div>
  )
}
