import React, { useEffect, useMemo, useState } from "react"
import { api } from "../../lib/api"

const STATUS_COLORS = {
  succeeded: { bg: "var(--emerald-100)", fg: "var(--emerald-900)" },
  pending: { bg: "var(--field-bg)", fg: "var(--text-muted)" },
  failed: { bg: "var(--red-100)", fg: "var(--red-900)" },
  refunded: { bg: "var(--red-100)", fg: "var(--red-900)" },
}

export default function Payments() {
  const [payments, setPayments] = useState(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => { api.get("/admin/payments").then((r) => setPayments(r.payments)) }, [])

  const stats = useMemo(() => {
    if (!payments) return null
    const succeeded = payments.filter((p) => p.status === "succeeded")
    const pending = payments.filter((p) => p.status === "pending")
    const failedOrRefunded = payments.filter((p) => p.status === "failed" || p.status === "refunded")
    const volume = succeeded.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    return { volume, succeededCount: succeeded.length, pendingCount: pending.length, failedCount: failedOrRefunded.length, total: payments.length }
  }, [payments])

  const filteredPayments = useMemo(() => {
    if (!payments) return []
    return payments.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        if (!p.bid.owner.name.toLowerCase().includes(q) && !p.bid.sitter.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [payments, search, statusFilter])

  if (!payments || !stats) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>Payments</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        Stripe charges collected from owners for accepted bids.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(11.5rem, 1fr))", gap: "0.9rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total volume" value={`$${stats.volume.toFixed(2)}`} sub={`from ${stats.succeededCount} succeeded charges`} />
        <StatCard label="Succeeded" value={stats.succeededCount} sub={`of ${stats.total} total charges`} />
        <StatCard label="Pending" value={stats.pendingCount} sub="awaiting confirmation" />
        <StatCard label="Failed / refunded" value={stats.failedCount} warn={stats.failedCount > 0} />
      </div>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.9rem" }}>
        <input
          type="search" placeholder="Search by owner or sitter…" value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "12rem", background: "var(--field-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "0.5rem", padding: "0.5rem 0.7rem", fontSize: "0.85rem" }}
        />
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: "var(--field-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "0.5rem", padding: "0.5rem 0.7rem", fontSize: "0.85rem" }}
        >
          <option value="all">All statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{filteredPayments.length} payment{filteredPayments.length === 1 ? "" : "s"}</span>
      </div>

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.85rem", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
          <thead>
            <tr>
              {["Bid", "Status", "Amount", "Platform fee", "Days covered", "Charged"].map((h) => (
                <th key={h} align="left" style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>No payments match your filters.</td></tr>
            ) : (
              filteredPayments.map((p) => <PaymentRow key={p.id} payment={p} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, warn }) {
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.7rem", padding: "0.95rem 1.05rem" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.76rem", marginTop: "0.25rem", color: warn ? "var(--red-900)" : "var(--text-muted)" }}>{sub}</div>}
    </div>
  )
}

function PaymentRow({ payment }) {
  const style = STATUS_COLORS[payment.status] || STATUS_COLORS.pending
  const charged = new Date(payment.created_at)

  return (
    <tr style={{ borderTop: "1px solid var(--border)" }}>
      <td style={{ padding: "0.75rem 1rem" }}>
        <div style={{ fontWeight: 600 }}>{payment.bid.sitter.name}</div>
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>for {payment.bid.owner.name}</div>
      </td>
      <td style={{ padding: "0.75rem 1rem" }}>
        <span style={{ display: "inline-block", background: style.bg, color: style.fg, fontSize: "0.72rem", fontWeight: 700, padding: "0.22rem 0.6rem", borderRadius: "999px", whiteSpace: "nowrap" }}>
          {payment.status[0].toUpperCase() + payment.status.slice(1)}
        </span>
      </td>
      <td style={{ padding: "0.75rem 1rem", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>${parseFloat(payment.amount).toFixed(2)}</td>
      <td style={{ padding: "0.75rem 1rem", fontVariantNumeric: "tabular-nums", color: "var(--text-muted)" }}>${parseFloat(payment.application_fee_amount).toFixed(2)}</td>
      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        {payment.accepted_dates.length} day{payment.accepted_dates.length === 1 ? "" : "s"}
      </td>
      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
        {charged.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, {charged.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
      </td>
    </tr>
  )
}
