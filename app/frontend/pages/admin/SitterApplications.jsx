import React, { useEffect, useState } from "react"
import { api } from "../../lib/api"

const STATUS_COLORS = {
  pending: { background: "var(--amber-50)", color: "var(--amber-700)" },
  approved: { background: "var(--emerald-100)", color: "var(--emerald-900)" },
  rejected: { background: "var(--red-100)", color: "var(--red-900)" },
}

export default function SitterApplications() {
  const [applications, setApplications] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const load = () => api.get("/admin/sitter_applications").then((r) => setApplications(r.sitter_applications))

  useEffect(() => { load() }, [])

  const decide = async (id, action) => {
    setBusyId(id)
    setError(null)
    try {
      await api.post(`/admin/sitter_applications/${id}/${action}`)
      await load()
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setBusyId(null)
    }
  }

  if (!applications) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Sitter applications</h1>
      {error && <p className="flash flash-alert">{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr>
            <th align="left">Name</th><th align="left">Email</th><th align="left">Address</th>
            <th align="left">Price/visit</th><th align="left">Experience</th><th align="left">Availability</th>
            <th align="left">Resume</th><th align="left">Status</th><th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((a) => (
            <tr key={a.id} style={{ borderTop: "1px solid var(--border)" }}>
              <td>{a.full_name}</td>
              <td>{a.email_address}</td>
              <td>{a.street_address ? `${a.street_address}, ${a.city}, ${a.state} ${a.zip_code}` : "—"}</td>
              <td>${Math.round(a.price_per_visit || 0)}</td>
              <td>{a.years_experience ?? "—"} yrs</td>
              <td style={{ fontSize: "0.8rem" }}>
                {a.availability_days?.length ? a.availability_days.map((d) => d.slice(0, 3)).join(", ") : "—"}
                {a.availability_times?.length ? ` (${a.availability_times.join(", ")})` : ""}
              </td>
              <td>
                {a.resume_url ? <a href={a.resume_url} target="_blank" rel="noreferrer" style={{ color: "var(--amber-700)" }}>{a.resume_filename || "View"}</a> : "—"}
              </td>
              <td>
                <span style={{ ...STATUS_COLORS[a.status], padding: "0.15rem 0.6rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600 }}>
                  {a.status}
                </span>
              </td>
              <td>
                {a.status === "pending" && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button" disabled={busyId === a.id} onClick={() => decide(a.id, "approve")}
                      className="btn btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      Approve
                    </button>
                    <button
                      type="button" disabled={busyId === a.id} onClick={() => decide(a.id, "reject")}
                      className="btn btn-outline" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
