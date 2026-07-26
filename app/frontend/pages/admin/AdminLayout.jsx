import React, { useEffect, useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { getAdminAuth, setAdminAuth, clearAdminAuth } from "../../lib/api"

function AdminLogin({ onAuthenticated }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/waitlist_signups", {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
        credentials: "include",
      })
      if (!response.ok) throw new Error("Invalid admin username or password.")
      setAdminAuth(username, password)
      onAuthenticated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="container" style={{ paddingTop: "4rem", maxWidth: "24rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Admin sign in</h1>
      {error && <p className="flash flash-alert">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="admin-username">Username</label>
          <input id="admin-username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  )
}

export default function AdminLayout() {
  const [authed, setAuthed] = useState(() => !!getAdminAuth())

  useEffect(() => {
    const onAuthRequired = () => setAuthed(false)
    window.addEventListener("admin-auth-required", onAuthRequired)
    return () => window.removeEventListener("admin-auth-required", onAuthRequired)
  }, [])

  if (!authed) return <AdminLogin onAuthenticated={() => setAuthed(true)} />

  const logOut = () => {
    clearAdminAuth()
    setAuthed(false)
  }

  return (
    <section className="container" style={{ paddingTop: "2rem" }}>
      <nav style={{ display: "flex", gap: "1rem", marginBottom: "2rem", fontSize: "0.875rem", alignItems: "center" }}>
        <NavLink to="/admin/waitlist_signups">Waitlist</NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/sitter_applications">Sitter applications</NavLink>
        <NavLink to="/admin/sitters">Sitters</NavLink>
        <NavLink to="/admin/service_areas">Service areas</NavLink>
        <NavLink to="/admin/zip_searches">ZIP searches</NavLink>
        <NavLink to="/admin/heatmap">Heatmap</NavLink>
        <NavLink to="/admin/jobs">Jobs</NavLink>
        <NavLink to="/admin/payments">Payments</NavLink>
        <button type="button" onClick={logOut} style={{ marginLeft: "auto", background: "transparent", border: 0, textDecoration: "underline", cursor: "pointer" }}>
          Log out
        </button>
      </nav>
      <Outlet />
    </section>
  )
}
