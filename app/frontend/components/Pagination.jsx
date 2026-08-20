import React from "react"

// Shared by every admin index. The server caps page size, so these lists are no longer rendered
// in full and the dashboard needs a way to reach the rest.
export default function Pagination({ meta, onChange }) {
  if (!meta || meta.total_pages <= 1) return null

  const { page, total_pages: totalPages, total_count: totalCount, per_page: perPage } = meta
  const first = (page - 1) * perPage + 1
  const last = Math.min(page * perPage, totalCount)

  const buttonStyle = (disabled) => ({
    padding: "0.35rem 0.7rem",
    borderRadius: "0.375rem",
    border: "1px solid var(--stone-200)",
    background: "var(--field-bg)",
    color: disabled ? "var(--text-muted)" : "inherit",
    cursor: disabled ? "default" : "pointer",
    fontSize: "0.85rem",
  })

  return (
    <nav
      aria-label="Pagination"
      style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}
    >
      <button type="button" style={buttonStyle(page <= 1)} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Previous
      </button>
      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        {first.toLocaleString()}–{last.toLocaleString()} of {totalCount.toLocaleString()}
      </span>
      <button
        type="button"
        style={buttonStyle(page >= totalPages)}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </button>
    </nav>
  )
}
