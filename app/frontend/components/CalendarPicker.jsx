import React, { useState } from "react"

const DOWS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export default function CalendarPicker({ selectedDates, onChange }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayKey = toDateKey(today)
  const minDateInput = todayKey

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [rangeStart, setRangeStart] = useState("")
  const [rangeEnd, setRangeEnd] = useState("")

  const selected = new Set(selectedDates)
  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const leadingBlanks = firstOfMonth.getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const isViewingCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  const toggleDay = (day) => {
    const key = toDateKey(new Date(viewYear, viewMonth, day))
    if (key < todayKey) return
    const next = new Set(selected)
    next.has(key) ? next.delete(key) : next.add(key)
    onChange(Array.from(next).sort())
  }

  const applyRange = (start, end) => {
    if (!start || !end) return
    const startDate = new Date(Math.max(new Date(start + "T00:00:00"), today))
    const endDate = new Date(end + "T00:00:00")
    if (startDate > endDate) return
    const next = new Set(selected)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      next.add(toDateKey(d))
    }
    onChange(Array.from(next).sort())
  }

  const changeMonth = (delta) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    if (y < today.getFullYear() || (y === today.getFullYear() && m < today.getMonth())) return
    setViewMonth(m)
    setViewYear(y)
  }

  return (
    <div className="cal-wrap">
      <div>
        <div className="cal-month-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" disabled={isViewingCurrentMonth}
            style={{ background: "transparent", border: 0, color: "var(--text-muted)", fontSize: "0.9rem", cursor: isViewingCurrentMonth ? "default" : "pointer", opacity: isViewingCurrentMonth ? 0.35 : 1 }}
          >
            ‹
          </button>
          <span>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", fontSize: "0.9rem" }}>›</button>
        </div>
        <div className="cal-grid">
          {DOWS.map((d) => <span key={d} className="dow">{d}</span>)}
          {Array.from({ length: leadingBlanks }).map((_, i) => <span key={`b${i}`} className="cal-day blank" />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const key = toDateKey(new Date(viewYear, viewMonth, day))
            const isPast = key < todayKey
            return (
              <button
                key={day} type="button"
                className={`cal-day${selected.has(key) ? " selected" : ""}${isPast ? " disabled" : ""}`}
                onClick={() => toggleDay(day)}
                disabled={isPast}
                aria-disabled={isPast}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
      <div className="cal-side">
        <div className="field">
          <label htmlFor="cal-start">Start date</label>
          <input
            id="cal-start" type="date" value={rangeStart} min={minDateInput}
            onChange={(e) => { setRangeStart(e.target.value); applyRange(e.target.value, rangeEnd) }}
          />
        </div>
        <div className="field">
          <label htmlFor="cal-end">End date</label>
          <input
            id="cal-end" type="date" value={rangeEnd} min={rangeStart || minDateInput}
            onChange={(e) => { setRangeEnd(e.target.value); applyRange(rangeStart, e.target.value) }}
          />
        </div>
        <p className="hint-sm">Filling both fills the range on the calendar. You can still click extra days on or off after. Past dates can't be selected.</p>
      </div>
    </div>
  )
}
