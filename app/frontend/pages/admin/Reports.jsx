import React, { useEffect, useState } from "react"
import { api } from "../../lib/api"

const STATUS_COLORS = {
  pending: { bg: "var(--amber-100)", fg: "var(--amber-900)" },
  reviewed: { bg: "var(--emerald-100)", fg: "var(--emerald-900)" },
  dismissed: { bg: "var(--red-100)", fg: "var(--red-900)" },
}

const REASON_LABELS = {
  no_show: "Didn't show up",
  inappropriate_behavior: "Inappropriate behavior",
  unsafe_conditions: "Unsafe conditions",
  payment_dispute: "Payment dispute",
  spam: "Spam or scam",
  other: "Other",
}

export default function Reports() {
  const [reports, setReports] = useState(null)

  useEffect(() => { api.get("/admin/reports").then((r) => setReports(r.reports)) }, [])

  const updateReport = (updated) => {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  const act = async (report, action) => {
    const result = await api.post(`/admin/reports/${report.id}/${action}`)
    updateReport(result.report)
  }

  if (!reports) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>Reports</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        User-submitted reports about other owners or sitters, pending first.
      </p>

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.85rem", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
          <thead>
            <tr>
              {["Reported", "Reported by", "Reason", "Details", "Status", "Actions"].map((h) => (
                <th key={h} align="left" style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>No reports filed.</td></tr>
            ) : (
              reports.map((r) => <ReportRow key={r.id} report={r} onAct={act} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReportRow({ report, onAct }) {
  const colors = STATUS_COLORS[report.status]

  return (
    <tr style={{ borderTop: "1px solid var(--border)" }}>
      <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{report.reported_user.name}</td>
      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>{report.reporter.name}</td>
      <td style={{ padding: "0.75rem 1rem" }}>{REASON_LABELS[report.reason] || report.reason}</td>
      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", maxWidth: "18rem" }}>{report.details || "—"}</td>
      <td style={{ padding: "0.75rem 1rem" }}>
        <span style={{ display: "inline-block", background: colors.bg, color: colors.fg, fontSize: "0.72rem", fontWeight: 700, padding: "0.22rem 0.6rem", borderRadius: "999px", whiteSpace: "nowrap" }}>
          {report.status}
        </span>
      </td>
      <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>
        {report.status === "pending" ? (
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button type="button" className="btn btn-primary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.7rem" }} onClick={() => onAct(report, "review")}>
              Mark reviewed
            </button>
            <button type="button" className="btn btn-outline" style={{ fontSize: "0.78rem", padding: "0.35rem 0.7rem" }} onClick={() => onAct(report, "dismiss")}>
              Dismiss
            </button>
          </div>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>—</span>
        )}
      </td>
    </tr>
  )
}
