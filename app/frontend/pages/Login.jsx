import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"

export default function Login() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email_address: "", password: "" })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const result = await api.post("/session", form)
      setUser(result.user)
      navigate("/")
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Try another email address or password.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container" style={{ paddingTop: "4rem", maxWidth: "24rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Sign in</h1>
      {error && <p className="flash flash-alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email_address">Email</label>
          <input id="email_address" type="email" name="email_address" value={form.email_address} onChange={handleChange} required />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
        <Link to="/passwords/new">Forgot your password?</Link>
      </p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </section>
  )
}
