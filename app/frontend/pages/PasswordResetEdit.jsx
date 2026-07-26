import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { api } from "../lib/api"

export default function PasswordResetEdit() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [valid, setValid] = useState(null)
  const [form, setForm] = useState({ password: "", password_confirmation: "" })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get(`/password_resets/${token}`).then((r) => setValid(r.valid)).catch(() => setValid(false))
  }, [token])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors([])
    try {
      await api.patch(`/password_resets/${token}`, form)
      navigate("/login")
    } catch (err) {
      setErrors(err.data?.errors || ["Passwords did not match."])
    } finally {
      setSubmitting(false)
    }
  }

  if (valid === false) {
    return (
      <section className="container" style={{ paddingTop: "4rem" }}>
        <p className="flash flash-alert">Password reset link is invalid or has expired.</p>
      </section>
    )
  }

  return (
    <section className="container" style={{ paddingTop: "4rem", maxWidth: "24rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Choose a new password</h1>
      {errors.length > 0 && <p className="flash flash-alert">{errors.join(", ")}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="password">New password</label>
          <input id="password" type="password" name="password" value={form.password} onChange={handleChange} required />
        </div>
        <div className="field">
          <label htmlFor="password_confirmation">Confirm password</label>
          <input id="password_confirmation" type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Saving…" : "Save new password"}
        </button>
      </form>
    </section>
  )
}
