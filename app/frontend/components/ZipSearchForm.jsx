import React, { useState } from "react"
import { api } from "../lib/api"

export default function ZipSearchForm({ onSuccess }) {
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
    <form onSubmit={handleSubmit} style={{ maxWidth: "24rem", margin: "0 auto", textAlign: "left" }}>
      {error && <p className="flash flash-alert">{error}</p>}
      <div className="field">
        <label htmlFor="city">City</label>
        <input id="city" name="city" value={form.city} onChange={handleChange} required />
      </div>
      <div className="field">
        <label htmlFor="state">State</label>
        <input id="state" name="state" value={form.state} onChange={handleChange} required maxLength={2} placeholder="CA" />
      </div>
      <div className="field">
        <label htmlFor="zip_code">ZIP code</label>
        <input id="zip_code" name="zip_code" value={form.zip_code} onChange={handleChange} required pattern="\d{5}" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
        {submitting ? "Searching…" : "Search"}
      </button>
    </form>
  )
}
