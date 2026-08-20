import React from "react"
import Pagination from "../../components/Pagination"
import { usePaginated } from "../../hooks/usePaginated"

export default function Users() {
  const { data, meta, setPage } = usePaginated("/admin/users")
  const users = data?.users

  if (!users) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Users</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead><tr><th align="left">Name</th><th align="left">Email</th><th align="left">Sitter?</th><th align="left">Price/visit</th><th align="left">ZIP</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderTop: "1px solid var(--stone-200)" }}>
              <td>{u.name}</td>
              <td>{u.email_address}</td>
              <td>{u.sitter ? "Yes" : "No"}</td>
              <td>{u.sitter ? `$${Math.round(u.sitter.price_per_visit)}` : "—"}</td>
              <td>{u.zip_code}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination meta={meta} onChange={setPage} />
    </div>
  )
}
