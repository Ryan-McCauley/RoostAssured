import React, { useState } from "react"
import { api } from "../lib/api"
import CopyReferralLink from "./CopyReferralLink"

export default function WaitlistForm({ initial = {}, referralCode, lockZip = false, onSuccess }) {
  const [form, setForm] = useState({
    email: "", city: initial.city || "", state: initial.state || "", zip_code: initial.zip_code || "", role: "owner",
  })
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const body = { waitlist_signup: { ...form, referred_by_code: referralCode } }
      const result = await api.post("/waitlist_signups", body)
      setSubmitted(result.waitlist_signup)
      onSuccess && onSuccess()
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: "24rem", margin: "0 auto", textAlign: "left" }}>
        <p className="flash flash-notice" style={{ borderRadius: "0.5rem", marginBottom: "1rem" }}>
          You're on the list — we'll email you when Roost Assured launches near you.
        </p>
        {submitted.referral_code && <CopyReferralLink code={submitted.referral_code} />}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "24rem", margin: "0 auto", textAlign: "left" }}>
      {error && <p className="flash flash-alert">{error}</p>}
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" name="email" value={form.email} onChange={handleChange} required />
      </div>
      {!lockZip && (
        <>
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" name="city" value={form.city} onChange={handleChange} required />
          </div>
          <div className="field">
            <label htmlFor="state">State</label>
            <input id="state" name="state" value={form.state} onChange={handleChange} required maxLength={2} />
          </div>
          <div className="field">
            <label htmlFor="zip_code">ZIP code</label>
            <input id="zip_code" name="zip_code" value={form.zip_code} onChange={handleChange} required pattern="\d{5}" />
          </div>
        </>
      )}
      <div className="field">
        <label htmlFor="role">I am a…</label>
        <select id="role" name="role" value={form.role} onChange={handleChange}>
          <option value="owner">Chicken owner</option>
          <option value="sitter">Sitter</option>
          <option value="both">Both</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
        {submitting ? "Joining…" : "Join the waitlist"}
      </button>
    </form>
  )
}
