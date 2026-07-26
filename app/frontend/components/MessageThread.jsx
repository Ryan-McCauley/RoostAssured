import React, { useEffect, useState } from "react"
import { api } from "../lib/api"

export default function MessageThread({ bidId, triggerStyle }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" className="btn btn-outline" onClick={() => setOpen(true)} style={{ padding: "0.3rem 0.8rem", fontSize: "0.82rem", ...triggerStyle }}>
        Message
      </button>
      {open && <MessageModal bidId={bidId} onClose={() => setOpen(false)} />}
    </>
  )
}

function MessageModal({ bidId, onClose }) {
  const [messages, setMessages] = useState([])
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/bids/${bidId}/messages`).then((r) => setMessages(r.messages)).finally(() => setLoading(false))
  }, [bidId])

  const send = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError(null)
    try {
      const result = await api.post(`/bids/${bidId}/messages`, { body })
      setMessages(result.messages)
      setBody("")
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(28, 25, 23, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem", zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg)", borderRadius: "1rem", width: "100%", maxWidth: "28rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)", padding: "1.5rem 1.75rem 1.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Messages</h3>
          <button
            onClick={onClose} aria-label="Close"
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ maxHeight: "18rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.9rem" }}>
          {loading ? (
            <p className="hint-sm">Loading…</p>
          ) : messages.length === 0 ? (
            <p className="hint-sm">No messages yet — say hello.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                <div style={{ background: m.mine ? "var(--amber-50)" : "var(--field-bg)", color: m.mine ? "var(--amber-700)" : "var(--text)", borderRadius: "0.6rem", padding: "0.4rem 0.65rem", fontSize: "0.85rem" }}>
                  {m.body}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.15rem", textAlign: m.mine ? "right" : "left" }}>
                  {m.mine ? "You" : m.sender_name}
                </div>
              </div>
            ))
          )}
        </div>

        {error && <p className="flash flash-alert" style={{ textAlign: "left", borderRadius: "0.4rem", fontSize: "0.85rem" }}>{error}</p>}

        <form onSubmit={send} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            autoFocus value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={sending || !body.trim()} style={{ padding: "0.5rem 1.1rem" }}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
