import React from "react"
import Pagination from "../../components/Pagination"
import { usePaginated } from "../../hooks/usePaginated"

export default function WaitlistSignups() {
  const { data, meta, setPage } = usePaginated("/admin/waitlist_signups")

  if (!data) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Waitlist signups</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr><th align="left">Email</th><th align="left">City</th><th align="left">Role</th><th align="left">Referrals</th></tr>
        </thead>
        <tbody>
          {data.waitlist_signups.map((w) => (
            <tr key={w.id} style={{ borderTop: "1px solid var(--stone-200)" }}>
              <td>{w.email}</td>
              <td>{w.city}, {w.state} {w.zip_code}</td>
              <td>{w.role}</td>
              <td>{w.referrals_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination meta={meta} onChange={setPage} />
    </div>
  )
}
