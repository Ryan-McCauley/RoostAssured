import React, { useEffect, useRef, useState } from "react"
import { api } from "../lib/api"

const REASONS = [
  { value: "no_show", label: "Didn't show up" },
  { value: "inappropriate_behavior", label: "Inappropriate behavior" },
  { value: "unsafe_conditions", label: "Unsafe conditions" },
  { value: "payment_dispute", label: "Payment dispute" },
  { value: "spam", label: "Spam or scam" },
  { value: "other", label: "Something else" },
]

export default function BlockReportMenu({ targetUserId, targetName, bidId, onBlocked }) {
  const [open, setOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const handleBlock = async () => {
    if (!window.confirm(`Block ${targetName}? You won't be matched with or able to message each other again.`)) return
    setBlocking(true)
    try {
      await api.post("/blocks", { blocked_user_id: targetUserId })
      setBlocked(true)
      setOpen(false)
      onBlocked && onBlocked(targetUserId)
    } catch {
      // no-op — the menu just stays open so they can try again
    } finally {
      setBlocking(false)
    }
  }

  if (blocked) return <span className="hint-sm">Blocked</span>

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        aria-label="More actions"
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", background: "transparent",
          border: "1px solid var(--border)", borderRadius: "999px", width: "1.9rem", height: "1.9rem",
          cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1,
        }}
      >
        ⋯
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: "calc(100% + 0.4rem)", right: 0, background: "var(--card-bg)",
            border: "1px solid var(--border)", borderRadius: "0.6rem", boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
            zIndex: 30, minWidth: "9.5rem", overflow: "hidden",
          }}
        >
          <button
            type="button" onClick={handleBlock} disabled={blocking}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "0.6rem 0.85rem", background: "transparent", border: 0, cursor: "pointer", color: "var(--text)", fontSize: "0.85rem" }}
          >
            {blocking ? "Blocking…" : "Block user"}
          </button>
          <button
            type="button" onClick={() => { setReportOpen(true); setOpen(false) }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "0.6rem 0.85rem", background: "transparent", border: 0, borderTop: "1px solid var(--border)", cursor: "pointer", color: "var(--red-900)", fontSize: "0.85rem" }}
          >
            Report user
          </button>
        </div>
      )}
      {reportOpen && (
        <ReportModal targetUserId={targetUserId} targetName={targetName} bidId={bidId} onClose={() => setReportOpen(false)} />
      )}
    </div>
  )
}

function ReportModal({ targetUserId, targetName, bidId, onClose }) {
  const [reason, setReason] = useState(REASONS[0].value)
  const [details, setDetails] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await api.post("/reports", { reported_user_id: targetUserId, bid_id: bidId, reason, details })
      setSubmitted(true)
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(28, 25, 23, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg)", borderRadius: "1rem", width: "100%", maxWidth: "26rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)", padding: "1.5rem 1.75rem 1.75rem", textAlign: "left",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Report {targetName}</h3>
          <button
            onClick={onClose} aria-label="Close"
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <p className="flash flash-notice" style={{ borderRadius: "0.5rem" }}>
            Thanks — our team will review this report.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p className="flash flash-alert" style={{ borderRadius: "0.4rem" }}>{error}</p>}
            <div className="field">
              <label htmlFor="report-reason">Reason</label>
              <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="report-details">Details (optional)</label>
              <textarea
                id="report-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)}
                placeholder="Anything our team should know."
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
              {submitting ? "Submitting…" : "Submit report"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
