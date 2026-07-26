import React, { useState } from "react"
import { api } from "../lib/api"

export default function SittingWindowForm({ onSuccess }) {
  const [form, setForm] = useState({ sitting_start_date: "", sitting_end_date: "" })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post("/sitting_window", form)
      onSuccess && onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setSubmitting(true)
    try {
      await api.post("/sitting_window", {})
      onSuccess && onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "24rem", margin: "0 auto", textAlign: "left" }}>
      <div className="field">
        <label htmlFor="sitting_start_date">Start date</label>
        <input id="sitting_start_date" type="date" name="sitting_start_date" value={form.sitting_start_date} onChange={handleChange} />
      </div>
      <div className="field">
        <label htmlFor="sitting_end_date">End date</label>
        <input id="sitting_end_date" type="date" name="sitting_end_date" value={form.sitting_end_date} onChange={handleChange} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%", marginBottom: "0.5rem" }}>
        Continue
      </button>
      <button type="button" onClick={handleSkip} disabled={submitting} style={{ background: "transparent", border: 0, color: "var(--amber-700)", textDecoration: "underline", cursor: "pointer", width: "100%" }}>
        Skip for now
      </button>
    </form>
  )
}
