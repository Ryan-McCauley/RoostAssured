import React, { useEffect, useMemo, useState } from "react"
import { api } from "../../lib/api"

const JOB_STATUS_LABELS = { not_started: "Not started", on_the_way: "On the way", in_progress: "In progress", completed: "Completed" }
const JOB_STATUS_COLORS = {
  not_started: { bg: "var(--field-bg)", fg: "var(--text-muted)" },
  on_the_way: { bg: "var(--amber-50)", fg: "var(--amber-700)" },
  in_progress: { bg: "var(--amber-50)", fg: "var(--amber-700)" },
  completed: { bg: "var(--emerald-100)", fg: "var(--emerald-900)" },
}

function formatElapsed(fromIso, toIso) {
  const totalHours = Math.max(0, (new Date(toIso) - new Date(fromIso)) / 36e5)
  const days = Math.floor(totalHours / 24)
  const hours = Math.floor(totalHours % 24)
  return days === 0 ? `${hours}h` : `${days}d ${hours}h`
}

function elapsedClass(fromIso, toIso, status) {
  if (status === "completed") return "done"
  const totalHours = (new Date(toIso) - new Date(fromIso)) / 36e5
  if (totalHours >= 72) return "overdue"
  if (totalHours >= 24) return "watch"
  return "neutral"
}

const ELAPSED_STYLES = {
  neutral: { bg: "var(--field-bg)", fg: "var(--text-muted)", border: "var(--border)" },
  watch: { bg: "var(--amber-50)", fg: "var(--amber-700)", border: "var(--amber-100)" },
  overdue: { bg: "var(--red-100)", fg: "var(--red-900)", border: "var(--red-100)" },
  done: { bg: "var(--emerald-100)", fg: "var(--emerald-900)", border: "var(--emerald-100)" },
}

export default function Jobs() {
  const [jobs, setJobs] = useState(null)
  const [now, setNow] = useState(() => new Date().toISOString())
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    api.get("/admin/jobs").then((r) => setJobs(r.jobs))
    const interval = setInterval(() => setNow(new Date().toISOString()), 60000)
    return () => clearInterval(interval)
  }, [])

  const stats = useMemo(() => {
    if (!jobs) return null
    const active = jobs.filter((j) => j.job_status !== "completed")
    const completed = jobs.filter((j) => j.job_status === "completed")
    const rated = jobs.filter((j) => j.rating)
    const avgRating = rated.length ? (rated.reduce((sum, j) => sum + j.rating, 0) / rated.length).toFixed(1) : "—"
    const flagged = jobs.filter((j) => j.stale)
    return { activeCount: active.length, completedCount: completed.length, avgRating, ratedCount: rated.length, flaggedCount: flagged.length }
  }, [jobs])

  const filteredJobs = useMemo(() => {
    if (!jobs) return []
    return jobs.filter((j) => {
      if (statusFilter !== "all" && j.job_status !== statusFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        if (!j.owner.name.toLowerCase().includes(q) && !j.sitter.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [jobs, search, statusFilter])

  if (!jobs || !stats) return <p>Loading…</p>

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>Jobs</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>
        Every accepted booking, from acceptance through completion.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(11.5rem, 1fr))", gap: "0.9rem", marginBottom: "1.5rem" }}>
        <StatCard label="Active jobs" value={stats.activeCount} />
        <StatCard label="Completed" value={stats.completedCount} />
        <StatCard label="Avg. sitter rating" value={stats.avgRating} sub={stats.ratedCount ? `from ${stats.ratedCount} review${stats.ratedCount === 1 ? "" : "s"}` : "no ratings yet"} />
        <StatCard label="Flagged (edited & stale)" value={stats.flaggedCount} warn={stats.flaggedCount > 0} sub={stats.flaggedCount > 0 ? "Needs sitter resubmission" : undefined} />
      </div>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.9rem" }}>
        <input
          type="search" placeholder="Search by owner or sitter…" value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "12rem", background: "var(--field-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "0.5rem", padding: "0.5rem 0.7rem", fontSize: "0.85rem" }}
        />
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: "var(--field-bg)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "0.5rem", padding: "0.5rem 0.7rem", fontSize: "0.85rem" }}
        >
          <option value="all">All statuses</option>
          {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", whiteSpace: "nowrap" }}>{filteredJobs.length} job{filteredJobs.length === 1 ? "" : "s"}</span>
      </div>

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.85rem", overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
          <thead>
            <tr>
              {["Job", "Status", "Dates", "Tasks", "Amount", "Rating", "Requested", "Elapsed"].map((h) => (
                <th key={h} align="left" style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "2.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>No jobs match your filters.</td></tr>
            ) : (
              filteredJobs.map((job) => <JobRow key={job.id} job={job} now={now} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, warn }) {
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.7rem", padding: "0.95rem 1.05rem" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.76rem", marginTop: "0.25rem", color: warn ? "var(--red-900)" : "var(--text-muted)" }}>{sub}</div>}
    </div>
  )
}

function JobRow({ job, now }) {
  const completedCount = job.job_tasks.filter((t) => t.completed).length
  const totalCount = job.job_tasks.length
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0
  const requested = new Date(job.created_at)
  const eClass = elapsedClass(job.created_at, now, job.job_status)
  const eStyle = ELAPSED_STYLES[eClass]
  const statusStyle = JOB_STATUS_COLORS[job.job_status]

  return (
    <tr style={{ borderTop: "1px solid var(--border)" }}>
      <td style={{ padding: "0.75rem 1rem" }}>
        <div style={{ fontWeight: 600 }}>{job.owner.name} <span style={{ color: "var(--text-muted)" }}>→</span> {job.sitter.name}</div>
        {job.stale && <div style={{ fontSize: "0.72rem", color: "var(--red-900)", fontWeight: 600 }}>● Request edited, awaiting resubmission</div>}
      </td>
      <td style={{ padding: "0.75rem 1rem" }}>
        <span style={{ display: "inline-block", background: statusStyle.bg, color: statusStyle.fg, fontSize: "0.72rem", fontWeight: 700, padding: "0.22rem 0.6rem", borderRadius: "999px", whiteSpace: "nowrap" }}>
          {JOB_STATUS_LABELS[job.job_status]}
        </span>
      </td>
      <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>{job.requested_dates.length} days</td>
      <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
        {totalCount ? `${completedCount}/${totalCount}` : "—"}
      </td>
      <td style={{ padding: "0.75rem 1rem", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>${Math.round(job.amount)}</td>
      <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap", color: "var(--amber-700)" }}>{job.rating ? `★ ${job.rating.toFixed(1)}` : <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
      <td style={{ padding: "0.75rem 1rem", whiteSpace: "nowrap" }}>
        {requested.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        <span style={{ display: "block", fontSize: "0.76rem", color: "var(--text-muted)" }}>
          {requested.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
        </span>
      </td>
      <td style={{ padding: "0.75rem 1rem" }}>
        <span style={{ display: "inline-block", background: eStyle.bg, color: eStyle.fg, border: `1px solid ${eStyle.border}`, fontSize: "0.78rem", fontWeight: 700, padding: "0.22rem 0.55rem", borderRadius: "999px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {formatElapsed(job.created_at, now)}
        </span>
      </td>
    </tr>
  )
}
