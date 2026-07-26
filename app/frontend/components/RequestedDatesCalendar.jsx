import React, { useState } from "react"

const DOWS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export default function RequestedDatesCalendar({ requestedDates, acceptedDates, declinedDates, onToggle }) {
  const initial = requestedDates.length ? parseDateKey(requestedDates[0]) : new Date()
  const [viewYear, setViewYear] = useState(initial.getFullYear())
  const [viewMonth, setViewMonth] = useState(initial.getMonth())

  const requested = new Set(requestedDates)
  const accepted = new Set(acceptedDates)
  const declined = new Set(declinedDates)

  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const leadingBlanks = firstOfMonth.getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const changeMonth = (delta) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setViewMonth(m)
    setViewYear(y)
  }

  const dateKey = (day) => {
    const d = new Date(viewYear, viewMonth, day)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  return (
    <div>
      <div className="cal-month-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", fontSize: "0.9rem" }}>‹</button>
        <span>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", fontSize: "0.9rem" }}>›</button>
      </div>
      <div className="cal-grid">
        {DOWS.map((d) => <span key={d} className="dow">{d}</span>)}
        {Array.from({ length: leadingBlanks }).map((_, i) => <span key={`b${i}`} className="cal-day blank" />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const key = dateKey(day)
          const isRequested = requested.has(key)
          const state = accepted.has(key) ? "accepted" : declined.has(key) ? "declined" : isRequested ? "requested" : null
          return (
            <button
              key={day} type="button"
              className={`cal-day${state ? ` ${state}` : ""}`}
              onClick={() => isRequested && onToggle(key)}
              disabled={!isRequested}
              title={isRequested ? "Click to cycle: requested → accepted → declined" : undefined}
            >
              {day}
            </button>
          )
        })}
      </div>
      <div style={{ display: "flex", gap: "1rem", marginTop: "0.6rem", fontSize: "0.76rem", color: "var(--text-muted)" }}>
        <LegendDot className="requested" label="Requested" />
        <LegendDot className="accepted" label="Accepted" />
        <LegendDot className="declined" label="Declined" />
      </div>
    </div>
  )
}

function LegendDot({ className, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
      <span className={`cal-day ${className}`} style={{ width: "0.85rem", height: "0.85rem", display: "inline-flex" }} />
      {label}
    </span>
  )
}
