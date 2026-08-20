import React, { useState } from "react"
import { api } from "../../lib/api"
import Pagination from "../../components/Pagination"
import { usePaginated } from "../../hooks/usePaginated"
import { useDebounced } from "../../hooks/useDebounced"

const STATUS_COLORS = {
  succeeded: { bg: "var(--emerald-100)", fg: "var(--emerald-900)" },
  pending: { bg: "var(--field-bg)", fg: "var(--text-muted)" },
  failed: { bg: "var(--red-100)", fg: "var(--red-900)" },
  refunded: { bg: "var(--red-100)", fg: "var(--red-900)" },
}

export default function Payments() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  // Debounced so typing doesn't fire a request per keystroke now that search runs server-side.
  const query = useDebounced(search, 300)

  const { data, meta, page, setPage, reload } = usePaginated("/admin/payments", {
    params: { ...(statusFilter !== "all" && { status: statusFilter }), ...(query.trim() && { q: query.trim() }) },
  })

  const payments = data?.payments
  // Totals come from the server, aggregated across every payment. Deriving them here would only
  // describe the page currently on screen.
  const stats = data?.stats

  const updatePayment = () => reload()

  // The server has already applied the filters and the page window.
  const filteredPayments = payments || []

  if (!payments || !stats) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>Payments</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        Stripe charges collected from owners for accepted bids.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(11.5rem, 1fr))", gap: "0.9rem", marginBottom: "1.5rem" }}>
        <StatCard label="Total volume" value={`$${stats.volume.toFixed(2)}`} sub={`from ${stats.succeeded_count} succeeded charges`} />
        <StatCard label="Succeeded" value={stats.succeeded_count} sub={`of ${stats.total} total charges`} />
        <StatCard label="Pending" value={stats.pending_count} sub="awaiting confirmation" />
        <StatCard label="Failed / refunded" value={stats.failed_count} warn={stats.failed_count > 0} />
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
        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{(meta?.total_count ?? 0).toLocaleString()} payment{meta?.total_count === 1 ? "" : "s"}</span>
      </div>

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.85rem", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
          <thead>
            <tr>
              {["Bid", "Status", "Amount", "Platform fee", "Days covered", "Charged", ""].map((h) => (
                <th key={h} align="left" style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>No payments match your filters.</td></tr>
            ) : (
              filteredPayments.map((p) => <PaymentRow key={p.id} payment={p} onRefunded={updatePayment} />)
            )}
          </tbody>
        </table>
        <Pagination meta={meta} onChange={setPage} />
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

function PaymentRow({ payment, onRefunded }) {
  const style = STATUS_COLORS[payment.status] || STATUS_COLORS.pending
  const charged = new Date(payment.created_at)
  const [refunding, setRefunding] = useState(false)
  const [error, setError] = useState(null)

  const refund = async () => {
    if (!window.confirm(`Refund $${parseFloat(payment.amount).toFixed(2)} to ${payment.bid.owner.name}? This can't be undone.`)) return

    setRefunding(true)
    setError(null)
    try {
      const result = await api.post(`/admin/payments/${payment.id}/refund`)
      onRefunded(result.payment)
    } catch (e) {
      setError(e.message || "Refund failed")
    } finally {
      setRefunding(false)
    }
  }

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
      <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>
        {payment.status === "succeeded" && (
          <button
            className="btn btn-outline" disabled={refunding} onClick={refund}
            style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem", color: "var(--red-900)", borderColor: "var(--red-900)" }}
          >
            {refunding ? "Refunding…" : "Refund"}
          </button>
        )}
        {error && <div style={{ color: "var(--red-900)", fontSize: "0.75rem", marginTop: "0.3rem" }}>{error}</div>}
      </td>
    </tr>
  )
}
