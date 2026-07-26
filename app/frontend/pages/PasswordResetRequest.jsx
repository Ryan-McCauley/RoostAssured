import React, { useState } from "react"
import { api } from "../lib/api"

export default function PasswordResetRequest() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const result = await api.post("/passwords", { email_address: email })
      setMessage(result.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container" style={{ paddingTop: "4rem", maxWidth: "24rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Reset your password</h1>
      {message ? (
        <p className="flash flash-notice">{message}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email_address">Email</label>
            <input id="email_address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
            {submitting ? "Sending…" : "Send reset instructions"}
          </button>
        </form>
      )}
    </section>
  )
}
