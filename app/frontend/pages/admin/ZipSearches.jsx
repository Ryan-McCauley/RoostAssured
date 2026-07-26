import React, { useEffect, useState } from "react"
import { api } from "../../lib/api"

export default function ZipSearches() {
  const [data, setData] = useState(null)

  useEffect(() => { api.get("/admin/zip_searches").then(setData) }, [])

  if (!data) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>ZIP searches ({data.total_searches})</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead><tr><th align="left">City</th><th align="left">State</th><th align="left">ZIP</th><th align="left">Count</th></tr></thead>
        <tbody>
          {data.top_locations.map((row, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--stone-200)" }}>
              <td>{row.city}</td><td>{row.state}</td><td>{row.zip_code}</td><td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
