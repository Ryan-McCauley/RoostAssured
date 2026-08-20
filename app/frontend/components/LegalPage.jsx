import React from "react"

export default function LegalPage({ title, updated, children }) {
  return (
    <section className="container" style={{ paddingTop: "3rem", paddingBottom: "4rem", maxWidth: "42rem" }}>
      <div
        className="flash"
        style={{
          background: "var(--amber-50)", color: "var(--amber-700)", textAlign: "left",
          borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "2rem", fontSize: "0.85rem", lineHeight: 1.5,
        }}
      >
        <strong>Draft — pending legal review.</strong> This page has not yet been reviewed by an attorney and is not
        final. Do not rely on it as a complete or binding statement of Roost Assured's terms until this notice is
        removed.
      </div>

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>{title}</h1>
      {updated && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>Last updated: {updated}</p>}

      <div className="legal-prose">{children}</div>
    </section>
  )
}
