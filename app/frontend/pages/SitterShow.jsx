import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "../lib/api"
import { useAuth } from "../context/AuthContext"
import BlockReportMenu from "../components/BlockReportMenu"

export default function SitterShow() {
  const { id } = useParams()
  const { user } = useAuth()
  const [sitter, setSitter] = useState(null)
  const [availabilities, setAvailabilities] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/sitters/${id}`)
      .then((r) => { setSitter(r.sitter); setAvailabilities(r.availabilities) })
      .catch(() => setError("Sitter not found."))
  }, [id])

  if (error) return <section className="container" style={{ paddingTop: "4rem" }}><p className="flash flash-alert">{error}</p></section>
  if (!sitter) return <section className="container" style={{ paddingTop: "4rem" }}>Loading…</section>

  return (
    <section className="container" style={{ paddingTop: "4rem", maxWidth: "32rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>{sitter.name}</h1>
        {user && user.id !== sitter.user_id && (
          <BlockReportMenu targetUserId={sitter.user_id} targetName={sitter.name} />
        )}
      </div>
      <p style={{ color: "var(--stone-600)" }}>{sitter.city}, {sitter.state}</p>
      <p style={{ fontWeight: 600, margin: "1rem 0" }}>${Math.round(sitter.price_per_visit)}/visit</p>
      {sitter.bio && <p>{sitter.bio}</p>}
      {sitter.years_experience != null && <p style={{ color: "var(--stone-600)" }}>{sitter.years_experience} years of experience</p>}

      <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "2rem" }}>Availability</h2>
      {availabilities.length === 0 ? (
        <p style={{ color: "var(--stone-600)" }}>No upcoming availability listed.</p>
      ) : (
        <ul>
          {availabilities.map((a) => (
            <li key={a.id}>{a.start_date} – {a.end_date}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
