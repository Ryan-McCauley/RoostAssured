import React from "react"
import { api } from "../../lib/api"
import Pagination from "../../components/Pagination"
import { usePaginated } from "../../hooks/usePaginated"

const ONBOARDING_COLORS = { bg: "var(--amber-100)", fg: "var(--amber-900)" }
const ACTIVE_COLORS = { bg: "var(--emerald-100)", fg: "var(--emerald-900)" }
const DEACTIVATED_COLORS = { bg: "var(--red-100)", fg: "var(--red-900)" }

export default function Sitters() {
  const { data, meta, setPage, reload } = usePaginated("/admin/sitters")
  const sitters = data?.sitters

  const toggleActive = async (sitter) => {
    const action = sitter.deactivated ? "reactivate" : "deactivate"
    await api.post(`/admin/sitters/${sitter.id}/${action}`)
    reload()
  }

  if (!sitters) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>Sitters</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        Approved sitters, their Stripe payout onboarding status, and account state.
      </p>

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.85rem", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
          <thead>
            <tr>
              {["Name", "Email", "Onboarding", "Account", "Actions"].map((h) => (
                <th key={h} align="left" style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sitters.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>No approved sitters yet.</td></tr>
            ) : (
              sitters.map((s) => <SitterRow key={s.id} sitter={s} onToggle={toggleActive} />)
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} onChange={setPage} />
    </div>
  )
}

function SitterRow({ sitter, onToggle }) {
  const onboardingStyle = sitter.stripe_onboarding_status === "complete" ? ACTIVE_COLORS : ONBOARDING_COLORS
  const onboardingLabel = sitter.stripe_onboarding_status === "complete" ? "Active" : "Onboarding"

  return (
    <tr style={{ borderTop: "1px solid var(--border)" }}>
      <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{sitter.name}</td>
      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)" }}>{sitter.email_address}</td>
      <td style={{ padding: "0.75rem 1rem" }}>
        <span style={{ display: "inline-block", background: onboardingStyle.bg, color: onboardingStyle.fg, fontSize: "0.72rem", fontWeight: 700, padding: "0.22rem 0.6rem", borderRadius: "999px", whiteSpace: "nowrap" }}>
          {onboardingLabel}
        </span>
      </td>
      <td style={{ padding: "0.75rem 1rem" }}>
        {sitter.deactivated ? (
          <span style={{ display: "inline-block", background: DEACTIVATED_COLORS.bg, color: DEACTIVATED_COLORS.fg, fontSize: "0.72rem", fontWeight: 700, padding: "0.22rem 0.6rem", borderRadius: "999px", whiteSpace: "nowrap" }}>
            Deactivated
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>—</span>
        )}
      </td>
      <td style={{ padding: "0.75rem 1rem" }}>
        <button
          type="button"
          onClick={() => onToggle(sitter)}
          className={sitter.deactivated ? "btn btn-primary" : "btn btn-outline"}
          style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem", color: sitter.deactivated ? undefined : "var(--red-900)", borderColor: sitter.deactivated ? undefined : "var(--red-900)" }}
        >
          {sitter.deactivated ? "Reactivate" : "Deactivate"}
        </button>
      </td>
    </tr>
  )
}
