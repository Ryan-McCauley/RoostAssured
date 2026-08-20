import React, { useState } from "react"

export default function Tooltip({ text }) {
  const [open, setOpen] = useState(false)

  return (
    <span
      style={{ position: "relative", display: "inline-flex", marginLeft: "0.35rem", verticalAlign: "middle" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={text}
        style={{
          width: "1.05rem", height: "1.05rem", borderRadius: "999px", border: "1px solid var(--border)",
          background: "var(--field-bg)", color: "var(--text-muted)", fontSize: "0.68rem", fontWeight: 700,
          lineHeight: 1, cursor: "help", padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute", bottom: "calc(100% + 0.4rem)", left: "50%", transform: "translateX(-50%)",
            background: "var(--brand-dark)", color: "var(--brand-cream)", border: "1px solid var(--border)",
            borderRadius: "0.5rem", padding: "0.5rem 0.65rem", fontSize: "0.78rem", fontWeight: 400,
            width: "max-content", maxWidth: "16rem", boxShadow: "0 10px 25px rgba(0,0,0,0.35)", zIndex: 20,
            textAlign: "left", lineHeight: 1.4,
          }}
        >
          {text}
        </span>
      )}
    </span>
  )
}
