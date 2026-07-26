import React from "react"

export default function Checklist({ options, value, onToggle }) {
  return (
    <div className="checklist">
      {options.map((option) => {
        const selected = value.includes(option)
        return (
          <button
            key={option} type="button" className={`check-row${selected ? " selected" : ""}`}
            onClick={() => onToggle(option)} aria-pressed={selected}
          >
            <span className="box">{selected ? "✓" : ""}</span>
            {option}
          </button>
        )
      })}
    </div>
  )
}
