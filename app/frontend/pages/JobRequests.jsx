import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import RequestedDatesCalendar from "../components/RequestedDatesCalendar"
import RequestLocationMap from "../components/RequestLocationMap"
import MessageThread from "../components/MessageThread"
import BlockReportMenu from "../components/BlockReportMenu"

function formatShortDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export default function JobRequests() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [showPassed, setShowPassed] = useState(false)
  const [passingId, setPassingId] = useState(null)
  const [jobs, setJobs] = useState([])

  useEffect(() => {
    if (!loading && !user) navigate("/login")
  }, [loading, user, navigate])

  useEffect(() => {
    api.get("/job_requests")
      .then(setData)
      .catch((err) => setError(err.data?.errors?.join(", ") || "Something went wrong."))
    api.get("/jobs").then((r) => setJobs(r.jobs)).catch(() => {})
  }, [])

  const applyJobRecord = (updated) => setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)))

  if (!user) return null
  if (error) return <section className="container" style={{ paddingTop: "4rem" }}><p className="flash flash-alert">{error}</p></section>
  if (!data) return <section className="container" style={{ paddingTop: "4rem" }}>Loading…</section>

  const { sitter, job_requests, passed_requests } = data
  const allJobs = [...job_requests, ...passed_requests]
  const selectedJob = allJobs.find((j) => j.id === selectedId) || null
  const activeJobs = jobs.filter((j) => j.job_status !== "completed")
  const completedJobs = jobs.filter((j) => j.job_status === "completed")

  // Moves a job between the active and passed lists based on its current bid status,
  // after either a bid submission or a pass/reconsider action changes that status.
  const applyJobUpdate = (updatedJob) => {
    const isPassed = updatedJob.my_bid?.status === "passed"
    setData((prev) => ({
      ...prev,
      job_requests: [...prev.job_requests.filter((j) => j.id !== updatedJob.id), ...(isPassed ? [] : [updatedJob])],
      passed_requests: [...prev.passed_requests.filter((j) => j.id !== updatedJob.id), ...(isPassed ? [updatedJob] : [])],
    }))
  }

  const handleBlockedOwner = (ownerUserId) => {
    setData((prev) => ({
      ...prev,
      job_requests: prev.job_requests.filter((j) => j.id !== ownerUserId),
      passed_requests: prev.passed_requests.filter((j) => j.id !== ownerUserId),
    }))
    if (selectedId === ownerUserId) setSelectedId(null)
  }

  const passJob = async (job) => {
    setPassingId(job.id)
    try {
      const result = await api.post(`/job_requests/${job.id}/pass`)
      applyJobUpdate({ ...job, my_bid: result.bid })
      if (selectedId === job.id) setSelectedId(null)
    } catch {
      // Silently ignore — the row stays put and the sitter can try again.
    } finally {
      setPassingId(null)
    }
  }

  return (
    <section className="container" style={{ paddingTop: "3.5rem", paddingBottom: "4rem" }}>
      {activeJobs.length > 0 && (
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>Accepted jobs</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            Booked requests you're currently working.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {activeJobs.map((job) => <MyJobCard key={job.id} job={job} onUpdate={applyJobRecord} />)}
          </div>
        </div>
      )}

      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>Requests &amp; pending bids</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
        {job_requests.length} open care request{job_requests.length === 1 ? "" : "s"} within {sitter.travel_radius_miles} miles of you, closest first. Click one for the full details.
      </p>

      {job_requests.length === 0 ? (
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
          No open requests in your area right now — check back soon.
        </div>
      ) : (
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.85rem", overflow: "hidden" }}>
          <div className="job-list-row job-list-header">
            <span>Owner</span>
            <span>Flock</span>
            <span>Sitting type</span>
            <span>Dates</span>
            <span>Distance</span>
            <span>Your bid</span>
            <span></span>
          </div>
          {job_requests.map((job) => (
            <JobListRow
              key={job.id} job={job}
              onOpen={() => setSelectedId(job.id)}
              onPass={() => passJob(job)}
              passing={passingId === job.id}
              onBlocked={handleBlockedOwner}
            />
          ))}
        </div>
      )}

      {passed_requests.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <button
            type="button" onClick={() => setShowPassed(!showPassed)}
            style={{ background: "transparent", border: 0, color: "var(--text-muted)", fontSize: "0.85rem", cursor: "pointer", padding: 0, textDecoration: "underline" }}
          >
            {showPassed ? "Hide" : "Show"} passed requests ({passed_requests.length})
          </button>

          {showPassed && (
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.85rem", overflow: "hidden", marginTop: "0.75rem", opacity: 0.75 }}>
              <div className="job-list-row job-list-header">
                <span>Owner</span>
                <span>Flock</span>
                <span>Sitting type</span>
                <span>Dates</span>
                <span>Distance</span>
                <span>Status</span>
                <span></span>
              </div>
              {passed_requests.map((job) => (
                <div key={job.id} className="job-list-row job-list-item" style={{ cursor: "default" }}>
                  <span>
                    <span style={{ display: "block", fontWeight: 700, color: "var(--text)" }}>{job.name}</span>
                    <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)" }}>{job.city}, {job.state}</span>
                  </span>
                  <span>{job.flock_size_tier || "—"}</span>
                  <span>{job.sitting_type || "—"}</span>
                  <span>{job.sitting_dates.length} day{job.sitting_dates.length === 1 ? "" : "s"}</span>
                  <span>{job.distance_miles != null ? `${job.distance_miles} mi` : "—"}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Passed</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <button type="button" className="btn btn-outline" style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }} onClick={() => setSelectedId(job.id)}>
                      Reconsider
                    </button>
                    <BlockReportMenu targetUserId={job.id} targetName={job.name} onBlocked={handleBlockedOwner} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {completedJobs.length > 0 && (
        <div style={{ marginTop: "2.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>Completed jobs</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            Wrapped-up requests, for your records.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {completedJobs.map((job) => <MyJobCard key={job.id} job={job} onUpdate={applyJobRecord} defaultExpanded={false} />)}
          </div>
        </div>
      )}

      {selectedJob && (
        <JobRequestDetailModal
          job={selectedJob}
          onClose={() => setSelectedId(null)}
          onBidSaved={applyJobUpdate}
          onPass={() => passJob(selectedJob)}
          onBlocked={handleBlockedOwner}
        />
      )}
    </section>
  )
}

function JobListRow({ job, onOpen, onPass, passing, onBlocked }) {
  return (
    <div className="job-list-row job-list-item" style={{ cursor: "pointer" }} onClick={onOpen}>
      <span>
        <span style={{ display: "block", fontWeight: 700, color: "var(--text)" }}>{job.name}</span>
        <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)" }}>{job.city}, {job.state}</span>
      </span>
      <span>{job.flock_size_tier || "—"}</span>
      <span>{job.sitting_type || "—"}</span>
      <span>
        {job.sitting_dates.length} day{job.sitting_dates.length === 1 ? "" : "s"}
        {job.sitting_dates.length > 0 && (
          <span style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            starts {formatShortDate(job.sitting_dates[0])}
          </span>
        )}
      </span>
      <span>{job.distance_miles != null ? `${job.distance_miles} mi` : "—"}</span>
      <span>
        {job.my_bid ? (
          <>
            <span style={{ background: "var(--amber-50)", color: "var(--amber-700)", fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
              ${Math.round(job.my_bid.amount)}
            </span>
            {job.my_bid.stale && (
              <span style={{ display: "inline-block", background: "var(--red-100)", color: "var(--red-900)", fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "999px", marginTop: "0.25rem" }}>
                Request updated
              </span>
            )}
          </>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Not bid</span>
        )}
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }} onClick={(e) => e.stopPropagation()}>
        <button
          type="button" className="btn btn-outline" disabled={passing}
          style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
          onClick={() => onPass()}
        >
          {passing ? "…" : "Pass"}
        </button>
        <BlockReportMenu targetUserId={job.id} targetName={job.name} bidId={job.my_bid?.id} onBlocked={onBlocked} />
      </span>
    </div>
  )
}

function JobRequestDetailModal({ job, onClose, onBidSaved, onPass, onBlocked }) {
  // A stale bid was written against the request's old sitting_dates — any accepted/declined
  // picks that no longer appear in the current dates would fail validation on resubmit, so drop them.
  const validDates = new Set(job.sitting_dates)
  const [bidForm, setBidForm] = useState({
    amount: job.my_bid && job.my_bid.status !== "passed" ? job.my_bid.amount : "",
    message: job.my_bid?.message || "",
    accepted_dates: (job.my_bid?.accepted_dates || []).filter((d) => validDates.has(d)),
    declined_dates: (job.my_bid?.declined_dates || []).filter((d) => validDates.has(d)),
  })
  const [submitting, setSubmitting] = useState(false)
  const [passing, setPassing] = useState(false)
  const [errors, setErrors] = useState([])
  const [notice, setNotice] = useState(null)

  const hasBid = !!job.my_bid && job.my_bid.status !== "passed"
  const isPassed = job.my_bid?.status === "passed"

  const cycleDate = (date) => {
    setBidForm((prev) => {
      const accepted = new Set(prev.accepted_dates)
      const declined = new Set(prev.declined_dates)
      if (accepted.has(date)) {
        accepted.delete(date)
        declined.add(date)
      } else if (declined.has(date)) {
        declined.delete(date)
      } else {
        accepted.add(date)
      }
      return { ...prev, accepted_dates: Array.from(accepted), declined_dates: Array.from(declined) }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors([])
    setNotice(null)
    try {
      const payload = { bid: bidForm }
      const result = (hasBid || isPassed)
        ? await api.patch(`/job_requests/${job.id}/bid`, payload)
        : await api.post(`/job_requests/${job.id}/bid`, payload)
      setBidForm({
        amount: result.bid.amount, message: result.bid.message || "",
        accepted_dates: result.bid.accepted_dates, declined_dates: result.bid.declined_dates,
      })
      setNotice(hasBid ? "Bid updated." : "Bid submitted.")
      onBidSaved({ ...job, my_bid: result.bid })
    } catch (err) {
      setErrors(err.data?.errors || ["Something went wrong."])
    } finally {
      setSubmitting(false)
    }
  }

  const handlePass = async () => {
    setPassing(true)
    setErrors([])
    try {
      await onPass()
    } finally {
      setPassing(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(28, 25, 23, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem", zIndex: 50, overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg)", borderRadius: "1rem", width: "100%", maxWidth: "36rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)", maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ padding: "1.5rem 1.75rem 1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.15rem" }}>{job.name}</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{job.city}, {job.state} {job.zip_code}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {job.distance_miles != null && (
                <span style={{ background: "var(--amber-50)", color: "var(--amber-700)", fontSize: "0.78rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "999px", whiteSpace: "nowrap" }}>
                  {job.distance_miles} mi away
                </span>
              )}
              <BlockReportMenu targetUserId={job.id} targetName={job.name} bidId={job.my_bid?.id} onBlocked={onBlocked} />
              <button
                onClick={onClose}
                aria-label="Close"
                style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {isPassed && (
            <div className="flash" style={{ background: "var(--field-bg)", color: "var(--text-muted)", textAlign: "left", borderRadius: "0.5rem", marginBottom: "1.1rem" }}>
              You passed on this request. Submitting a bid below will bring it back into your active list.
            </div>
          )}

          {job.my_bid?.stale && (
            <div className="flash flash-alert" style={{ textAlign: "left", borderRadius: "0.5rem", marginBottom: "1.1rem" }}>
              {job.name} updated this request since you last bid — review the details below and resubmit your bid.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))", gap: "0.9rem", marginBottom: "1rem" }}>
            <Field label="Location">
              {job.city}, {job.state} {job.zip_code}<br />
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Exact address shared once your bid is accepted</span>
            </Field>
            <Field label="Flock size">{job.flock_size_tier || "—"}</Field>
            <Field label="Sitting type">{job.sitting_type || "—"}</Field>
            <Field label="Feeders / waterers">{job.feeder_count ?? "—"} / {job.waterer_count ?? "—"}</Field>
            <Field label="Feed location">{job.feed_location || "—"}</Field>
            <Field label="Water location">{job.water_location || "—"}</Field>
          </div>

          {job.coop_features?.length > 0 && (
            <Field label="Coop setup" block>
              <div className="pill-group">
                {job.coop_features.map((f) => <span key={f} className="pill selected">{f}</span>)}
              </div>
            </Field>
          )}

          <Field label="Care tasks" block>
            <div className="pill-group">
              {job.care_tasks.map((t) => <span key={t} className="pill selected">{t}</span>)}
              {job.other_care_task && <span className="pill selected">{job.other_care_task}</span>}
            </div>
          </Field>

          {job.special_requests && (
            <Field label="Special requests" block>
              <p style={{ fontSize: "0.88rem", color: "var(--text)", margin: 0 }}>{job.special_requests}</p>
            </Field>
          )}

          <Field label="Dates & location" block>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1rem", alignItems: "start" }}>
              <RequestedDatesCalendar
                requestedDates={job.sitting_dates}
                acceptedDates={bidForm.accepted_dates}
                declinedDates={bidForm.declined_dates}
                onToggle={cycleDate}
              />
              <RequestLocationMap latitude={job.latitude} longitude={job.longitude} label={`${job.city}, ${job.state}`} />
            </div>
          </Field>

          <div style={{ borderTop: "1px solid var(--border)", marginTop: "1.25rem", paddingTop: "1.1rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              {hasBid ? "Your bid" : "Submit a bid"}
            </h3>
            {notice && <p className="flash flash-notice" style={{ textAlign: "left", borderRadius: "0.4rem" }}>{notice}</p>}
            {errors.length > 0 && <p className="flash flash-alert" style={{ textAlign: "left", borderRadius: "0.4rem" }}>{errors.join(", ")}</p>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor={`amount-${job.id}`}>Your bid ($ per visit)</label>
                <input
                  id={`amount-${job.id}`} type="number" min="0" step="0.01" required
                  value={bidForm.amount} onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor={`message-${job.id}`}>Message to owner (optional)</label>
                <textarea
                  id={`message-${job.id}`} rows={2} value={bidForm.message}
                  onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                  placeholder="Anything the owner should know about your bid."
                />
              </div>
              <p className="hint-sm" style={{ marginBottom: "0.75rem" }}>
                Click days on the calendar above to accept or decline them — pending days count as undecided.
              </p>
              <div style={{ display: "flex", gap: "0.6rem" }}>
                {!isPassed && (
                  <button type="button" className="btn btn-outline" disabled={passing || submitting} onClick={handlePass}>
                    {passing ? "…" : "Pass on this request"}
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? "Saving…" : hasBid ? "Update bid" : "Submit bid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

const JOB_STATUS_LABELS = { not_started: "Not started", on_the_way: "On the way", in_progress: "In progress", completed: "Completed" }

// Converts an ISO timestamp to the local "YYYY-MM-DDTHH:mm" value a datetime-local input expects.
function toLocalInputValue(isoString) {
  if (!isoString) return ""
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const JOB_STATUS_COLORS = {
  not_started: { bg: "var(--field-bg)", fg: "var(--text-muted)" },
  on_the_way: { bg: "var(--amber-50)", fg: "var(--amber-700)" },
  in_progress: { bg: "var(--amber-50)", fg: "var(--amber-700)" },
  completed: { bg: "var(--emerald-100)", fg: "var(--emerald-900)" },
}

function MyJobCard({ job, onUpdate, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [changingStatus, setChangingStatus] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [error, setError] = useState(null)
  const [eta, setEta] = useState(toLocalInputValue(job.estimated_arrival_at))
  const [savingEta, setSavingEta] = useState(false)

  const allTasksDone = job.job_tasks.length === 0 || job.job_tasks.every((t) => t.completed)
  const hasPhoto = job.job_tasks.length === 0 || job.job_tasks.some((t) => t.photo_url)
  const canComplete = allTasksDone && hasPhoto

  const completionBlockedReason = !allTasksDone ? " (finish checklist first)" : !hasPhoto ? " (add a photo first)" : ""

  const changeStatus = async (e) => {
    const job_status = e.target.value
    setChangingStatus(true)
    setError(null)
    try {
      const payload = { job_status }
      if (job_status === "on_the_way" && eta) payload.estimated_arrival_at = new Date(eta).toISOString()
      const result = await api.patch(`/jobs/${job.id}/status`, payload)
      onUpdate(result.job)
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setChangingStatus(false)
    }
  }

  const saveEta = async () => {
    setSavingEta(true)
    setError(null)
    try {
      const result = await api.patch(`/jobs/${job.id}/eta`, { estimated_arrival_at: eta ? new Date(eta).toISOString() : null })
      onUpdate(result.job)
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setSavingEta(false)
    }
  }

  const completedCount = job.job_tasks.filter((t) => t.completed).length
  const confirmedDays = job.requested_dates.length - job.declined_dates.length

  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "0.75rem", overflow: "hidden" }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", padding: "1rem 1.1rem", cursor: "pointer" }}
      >
        <div>
          <span style={{ display: "block", fontWeight: 700 }}>${Math.round(job.amount)}/visit</span>
          <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {confirmedDays} of {job.requested_dates.length} day{job.requested_dates.length === 1 ? "" : "s"} confirmed
            {job.job_tasks.length > 0 && ` · ${completedCount}/${job.job_tasks.length} tasks done`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {job.sitter_notes && (
            <span title="Notes added" style={{ fontSize: "0.95rem", lineHeight: 1 }}>📝</span>
          )}
          <span style={{ background: JOB_STATUS_COLORS[job.job_status].bg, color: JOB_STATUS_COLORS[job.job_status].fg, fontSize: "0.78rem", fontWeight: 700, padding: "0.25rem 0.7rem", borderRadius: "999px", whiteSpace: "nowrap" }}>
            {JOB_STATUS_LABELS[job.job_status]}
          </span>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: "var(--text-muted)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 1.1rem 1.1rem" }}>
          {error && <p className="flash flash-alert" style={{ textAlign: "left", borderRadius: "0.4rem", fontSize: "0.85rem" }}>{error}</p>}

          {job.owner_contact && (
            <div style={{ marginBottom: "0.85rem", paddingBottom: "0.85rem", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Owner contact
              </p>
              <p style={{ fontSize: "0.88rem", margin: 0 }}>
                {job.owner_contact.name}<br />
                {job.owner_contact.phone_number || "—"}<br />
                {job.owner_contact.address || "—"}<br />
                {job.owner_contact.city}, {job.owner_contact.state} {job.owner_contact.zip_code}
              </p>
            </div>
          )}

          <div className="field" style={{ marginBottom: "0.85rem" }}>
            <label htmlFor={`job-status-${job.id}`} style={{ fontSize: "0.78rem" }}>Job status</label>
            <select id={`job-status-${job.id}`} value={job.job_status} onChange={changeStatus} disabled={changingStatus}>
              {Object.entries(JOB_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value} disabled={value === "completed" && !canComplete}>
                  {label}{value === "completed" ? completionBlockedReason : ""}
                </option>
              ))}
            </select>
          </div>

          {(job.job_status === "not_started" || job.job_status === "on_the_way") && (
            <div className="field" style={{ marginBottom: "0.85rem" }}>
              <label htmlFor={`job-eta-${job.id}`} style={{ fontSize: "0.78rem" }}>Estimated arrival</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  id={`job-eta-${job.id}`} type="datetime-local" value={eta}
                  onChange={(e) => setEta(e.target.value)} style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-outline" disabled={savingEta} onClick={saveEta} style={{ padding: "0.3rem 0.8rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                  {savingEta ? "…" : "Save"}
                </button>
              </div>
            </div>
          )}

          {job.rating && (
            <p className="hint-sm" style={{ marginBottom: "0.75rem" }}>
              Rated {job.rating}/5{job.review && ` — "${job.review}"`}
            </p>
          )}

          {job.job_tasks.length > 0 && (
            <div style={{ marginBottom: "1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                Checklist
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {job.job_tasks.map((task) => (
                  <JobTaskRow key={task.id} jobId={job.id} task={task} onUpdate={onUpdate} />
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border)" }}>
            <button type="button" className="btn btn-outline" onClick={() => setNotesOpen(true)} style={{ padding: "0.3rem 0.8rem", fontSize: "0.82rem" }}>
              📝 {job.sitter_notes ? "Edit notes" : "Add notes"}
            </button>
            <MessageThread bidId={job.id} />
            <BlockReportMenu targetUserId={job.owner_id} targetName={job.owner_contact?.name || "this owner"} bidId={job.id} />
          </div>
        </div>
      )}

      {notesOpen && (
        <JobNotesModal jobId={job.id} notes={job.sitter_notes} onUpdate={onUpdate} onClose={() => setNotesOpen(false)} />
      )}
    </div>
  )
}

function JobNotesModal({ jobId, notes, onUpdate, onClose }) {
  const [value, setValue] = useState(notes || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const result = await api.patch(`/jobs/${jobId}/notes`, { sitter_notes: value })
      onUpdate(result.job)
      onClose()
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(28, 25, 23, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem", zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg)", borderRadius: "1rem", width: "100%", maxWidth: "28rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)", padding: "1.5rem 1.75rem 1.75rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Notes for the owner</h3>
          <button
            onClick={onClose} aria-label="Close"
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="hint-sm" style={{ marginBottom: "0.75rem" }}>
          Anything the owner should know — a loose latch, low feed, a vet visit, etc. This is optional and visible to the owner.
        </p>

        {error && <p className="flash flash-alert" style={{ textAlign: "left", borderRadius: "0.4rem", fontSize: "0.85rem" }}>{error}</p>}

        <textarea
          autoFocus rows={5} value={value} onChange={(e) => setValue(e.target.value)}
          placeholder="Write a note…" style={{ marginBottom: "1rem" }}
        />

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={save} style={{ flex: 1 }}>
            {saving ? "Saving…" : "Save notes"}
          </button>
        </div>
      </div>
    </div>
  )
}

function JobTaskRow({ jobId, task, onUpdate }) {
  const [toggling, setToggling] = useState(false)
  const [uploading, setUploading] = useState(false)

  const toggleCompleted = async () => {
    setToggling(true)
    try {
      const result = await api.patch(`/jobs/${jobId}/tasks/${task.id}`, { completed: !task.completed })
      onUpdate(result.job)
    } finally {
      setToggling(false)
    }
  }

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const data = new FormData()
      data.append("photo", file)
      const result = await api.post(`/jobs/${jobId}/tasks/${task.id}/photo`, data)
      onUpdate(result.job)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
      <input
        type="checkbox" checked={task.completed} disabled={toggling} onChange={toggleCompleted}
        style={{ width: "auto", marginTop: "0.2rem" }}
      />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: "0.88rem", textDecoration: task.completed ? "line-through" : "none", color: task.completed ? "var(--text-muted)" : "var(--text)" }}>
          {task.description}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.3rem" }}>
          {task.photo_url && (
            <a href={task.photo_url} target="_blank" rel="noreferrer">
              <img src={task.photo_url} alt={task.description} style={{ width: "3rem", height: "3rem", objectFit: "cover", borderRadius: "0.4rem", border: "1px solid var(--border)" }} />
            </a>
          )}
          <label style={{ fontSize: "0.76rem", color: "var(--amber-700)", textDecoration: "underline", cursor: "pointer" }}>
            {uploading ? "Uploading…" : task.photo_url ? "Replace photo" : "Add photo"}
            <input type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} style={{ display: "none" }} />
          </label>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, block }) {
  return (
    <div style={{ marginTop: block ? "0.9rem" : 0 }}>
      <div style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.9rem" }}>{children}</div>
    </div>
  )
}
