import React from "react"

export default function Stepper({ value, onChange }) {
  const count = parseInt(value, 10) || 0
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(-1)} aria-label="Decrease">–</button>
      <span className="count">{count}</span>
      <button type="button" onClick={() => onChange(1)} aria-label="Increase">+</button>
    </div>
  )
}
