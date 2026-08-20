import React, { useEffect, useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import ZipSearchForm from "../components/ZipSearchForm"
import SittingWindowForm from "../components/SittingWindowForm"
import WaitlistForm from "../components/WaitlistForm"
import CareRequestModal from "../components/CareRequestModal"
import MessageThread from "../components/MessageThread"
import BlockReportMenu from "../components/BlockReportMenu"
import useJobChannel from "../hooks/useJobChannel"
import useSeo from "../hooks/useSeo"

const JOB_STATUS_LABELS = { not_started: "Not started", on_the_way: "On the way", in_progress: "In progress", completed: "Completed" }

function formatEta(isoString) {
  if (!isoString) return null
  return new Date(isoString).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function JobStatusSync({ bidId, onUpdate }) {
  useJobChannel(bidId, onUpdate)
  return null
}

function RateSitterForm({ onSubmit }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) return
    setSubmitting(true)
    try {
      await onSubmit(rating, review)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="hint-sm" style={{ marginBottom: "0.4rem" }}>How'd it go? Rate your sitter.</p>
      <div style={{ display: "flex", gap: "0.2rem", marginBottom: "0.6rem" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)} onMouseLeave={() => setHoverRating(0)}
            style={{ background: "none", border: 0, padding: 0, cursor: "pointer", fontSize: "1.4rem", lineHeight: 1, color: n <= (hoverRating || rating) ? "var(--amber-500)" : "var(--border)" }}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2} value={review} onChange={(e) => setReview(e.target.value)}
        placeholder="Leave a review (optional)" style={{ marginBottom: "0.6rem" }}
      />
      <button type="submit" className="btn btn-primary" disabled={!rating || submitting} style={{ width: "100%" }}>
        {submitting ? "Saving…" : "Submit rating"}
      </button>
    </form>
  )
}

function BidCard({ bid, user, bidActionId, onDecide, onRate, onJobUpdate, onEditRequest, onBlocked }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem 1.1rem", textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          {bid.sitter.profile_photo_url ? (
            <img
              src={bid.sitter.profile_photo_url} alt={bid.sitter.name}
              style={{ width: "2.75rem", height: "2.75rem", objectFit: "cover", borderRadius: "999px", border: "1px solid var(--border)", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: "2.75rem", height: "2.75rem", borderRadius: "999px", flexShrink: 0,
                background: "var(--field-bg)", border: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-muted)",
              }}
            >
              {bid.sitter.name.charAt(0)}
            </div>
          )}
          <div>
            <span style={{ display: "block", fontWeight: 700 }}>{bid.sitter.name}</span>
            <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)" }}>{bid.sitter.city}, {bid.sitter.state} · {bid.sitter.years_experience ?? "?"} yrs experience</span>
            {bid.sitter.average_rating ? (
              <span style={{ display: "block", fontSize: "0.8rem", color: "var(--amber-600)" }}>
                ★ {bid.sitter.average_rating} ({bid.sitter.ratings_count} rating{bid.sitter.ratings_count === 1 ? "" : "s"})
              </span>
            ) : (
              <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)" }}>No ratings yet</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontWeight: 700, color: "var(--amber-700)" }}>${Math.round(bid.amount)}/visit</span>
          <BlockReportMenu targetUserId={bid.sitter.user_id} targetName={bid.sitter.name} bidId={bid.id} onBlocked={onBlocked} />
        </div>
      </div>
      {bid.sitter.bio && <p style={{ fontSize: "0.85rem", color: "var(--text)", marginBottom: "0.5rem" }}>{bid.sitter.bio}</p>}
      {bid.message && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "0.5rem" }}>"{bid.message}"</p>}
      {bid.status === "submitted" ? (
        <p className="hint-sm" style={{ marginBottom: "0.75rem" }}>
          {bid.accepted_dates.length} day{bid.accepted_dates.length === 1 ? "" : "s"} accepted, {bid.declined_dates.length} declined by this sitter.
        </p>
      ) : (
        <p className="hint-sm" style={{ marginBottom: "0.75rem" }}>
          {(user.sitting_dates?.length || 0) - bid.declined_dates.length} of {user.sitting_dates?.length || 0} day{user.sitting_dates?.length === 1 ? "" : "s"} confirmed
          {bid.declined_dates.length > 0 && `, ${bid.declined_dates.length} declined by this sitter`}.
        </p>
      )}

      {bid.status === "submitted" && (
        <>
          {bid.stale && (
            <p className="hint-sm" style={{ background: "var(--amber-50)", color: "var(--amber-700)", borderRadius: "0.5rem", padding: "0.6rem 0.75rem", marginBottom: "0.75rem" }}>
              You edited this request — {bid.sitter.name.split(" ")[0]} needs to review the changes and resubmit before you can accept.
            </p>
          )}
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              type="button" className="btn btn-primary" style={{ flex: 1 }}
              disabled={bidActionId === bid.id || bid.stale} onClick={() => onDecide(bid.id, "accept")}
            >
              {bidActionId === bid.id ? "…" : "Accept"}
            </button>
            <button
              type="button" className="btn btn-outline" style={{ flex: 1 }}
              disabled={bidActionId === bid.id || bid.stale} onClick={() => onDecide(bid.id, "reject")}
            >
              {bidActionId === bid.id ? "…" : "Reject"}
            </button>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.6rem" }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onEditRequest}>
              Edit request
            </button>
            <MessageThread bidId={bid.id} triggerStyle={{ flex: 1 }} />
          </div>
        </>
      )}
      {bid.status === "accepted" && (
        <div>
          <JobStatusSync bidId={bid.id} onUpdate={(data) => onJobUpdate(bid.id, data)} />
          <span style={{ background: "var(--emerald-100)", color: "var(--emerald-900)", fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
            {bid.job_status === "completed" ? "Completed" : "Accepted"}
          </span>

          <p className="hint-sm" style={{ marginTop: "0.6rem" }}>
            {bid.job_status === "on_the_way" && (
              formatEta(bid.estimated_arrival_at)
                ? `🚗 ${bid.sitter.name.split(" ")[0]} is on the way — ETA ${formatEta(bid.estimated_arrival_at)}.`
                : `🚗 ${bid.sitter.name.split(" ")[0]} is on the way.`
            )}
            {bid.job_status === "not_started" && `Waiting for ${bid.sitter.name.split(" ")[0]} to head over.`}
            {(bid.job_status === "in_progress" || bid.job_status === "completed") && `Job status: ${JOB_STATUS_LABELS[bid.job_status]}`}
          </p>

          {bid.job_tasks.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Checklist
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {bid.job_tasks.map((task) => (
                  <div key={task.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>{task.completed ? "✅" : "⬜"}</span>
                    <span style={{ fontSize: "0.85rem", textDecoration: task.completed ? "line-through" : "none", color: task.completed ? "var(--text-muted)" : "var(--text)" }}>
                      {task.description}
                    </span>
                    {task.photo_url && (
                      <a href={task.photo_url} target="_blank" rel="noreferrer">
                        <img src={task.photo_url} alt={task.description} style={{ width: "2.5rem", height: "2.5rem", objectFit: "cover", borderRadius: "0.35rem", border: "1px solid var(--border)" }} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bid.sitter_notes && (
            <div style={{ marginTop: "0.75rem" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Notes from {bid.sitter.name.split(" ")[0]}
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--text)" }}>{bid.sitter_notes}</p>
            </div>
          )}

          <MessageThread bidId={bid.id} />

          <div style={{ marginTop: "0.9rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
            {bid.rating ? (
              <p className="hint-sm">You rated this sitter {bid.rating}/5{bid.review && ` — "${bid.review}"`}</p>
            ) : bid.job_status === "completed" ? (
              <RateSitterForm onSubmit={(rating, review) => onRate(bid.id, rating, review)} />
            ) : (
              <p className="hint-sm">You'll be able to rate this sitter once the job is marked completed.</p>
            )}
          </div>
        </div>
      )}
      {bid.status === "rejected" && (
        <span style={{ background: "var(--red-100)", color: "var(--red-900)", fontSize: "0.78rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px" }}>Rejected</span>
      )}
    </div>
  )
}

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Search your ZIP code",
    description: "Tell us where your coop is and we'll show you the chicken sitters already serving your area.",
  },
  {
    step: "2",
    title: "Compare sitters & bids",
    description: "Review local sitters' experience and ratings, then pick the bid that fits your flock and budget.",
  },
  {
    step: "3",
    title: "Relax with photo updates",
    description: "Your sitter feeds, waters, and collects eggs on schedule — with a photo after every visit.",
  },
]

const FAQS = [
  {
    q: "What does a chicken sitter do?",
    a: "A Roost Assured chicken sitter visits your coop while you're away to feed and water your flock, collect eggs, check for predator damage, and clean up as needed. Every visit ends with a photo update so you can see your flock is safe.",
  },
  {
    q: "How much does chicken sitting cost?",
    a: "Sitters on Roost Assured set their own per-visit rate and bid on your specific request, so pricing varies by area and how much care your flock needs. You'll see exact bid amounts before you accept anyone.",
  },
  {
    q: "Are Roost Assured sitters background-checked?",
    a: "Yes. Every sitter application goes through a background check before they're approved to bid on care requests.",
  },
  {
    q: "What areas does Roost Assured serve?",
    a: "We're expanding one ZIP code at a time. Search your ZIP above to see if we're active near you — if not, join the waitlist and we'll email you the moment we launch in your area.",
  },
  {
    q: "How do I become a chicken sitter?",
    a: "Create a free account, submit a sitter application, and pass a background check. Once approved, you can browse open care requests from chicken owners near you and submit bids.",
  },
]

function FaqItem({ faq, open, onToggle }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
          background: "transparent", border: 0, padding: "1.1rem 0", cursor: "pointer", textAlign: "left",
          color: "var(--text)", fontWeight: 700, fontSize: "1rem",
        }}
      >
        {faq.q}
        <span style={{ flexShrink: 0, color: "var(--amber-500)", fontSize: "1.2rem", lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6, paddingBottom: "1.1rem", margin: 0 }}>{faq.a}</p>}
    </div>
  )
}

function MarketingSections() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <>
      <section style={{ background: "var(--card-bg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div id="how-it-works" className="container" style={{ padding: "3.5rem 1.25rem", scrollMarginTop: "5rem" }}>
          <p style={{ textAlign: "center", color: "var(--amber-600)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
            How it works
          </p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.45rem, 5vw, 1.9rem)", fontWeight: 700, marginBottom: "2.5rem" }}>
            Booking a trusted chicken sitter takes minutes.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))", gap: "2rem" }}>
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} style={{ textAlign: "center" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", width: "2.75rem", height: "2.75rem",
                    margin: "0 auto 1rem", borderRadius: "999px", background: "var(--brand-dark)", color: "var(--brand-amber)",
                    fontWeight: 700, fontSize: "1.1rem", border: "1px solid var(--border)",
                  }}
                >
                  {item.step}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{item.title}</h3>
                <p style={{ color: "var(--stone-600)", fontSize: "0.9rem", lineHeight: 1.6 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="become-a-sitter" style={{ background: "var(--brand-dark)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", scrollMarginTop: "5rem" }}>
        <div className="container mkt-cta">
          <div className="mkt-cta-copy" style={{ maxWidth: "32rem" }}>
            <p style={{ color: "var(--brand-amber)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
              Keep chickens yourself?
            </p>
            <h2 style={{ fontSize: "clamp(1.4rem, 4.5vw, 1.75rem)", fontWeight: 700, marginBottom: "0.75rem", color: "var(--brand-cream)" }}>
              Become a background-checked chicken sitter and earn on your own schedule.
            </h2>
            <p style={{ color: "#b7ab98", fontSize: "0.95rem", lineHeight: 1.6 }}>
              Set your own rates, bid on care requests near you, and get paid for feeding, egg collection,
              and coop care — no long-term commitment required.
            </p>
          </div>
          <Link to="/become-a-sitter" className="btn btn-primary" style={{ flexShrink: 0 }}>Learn more</Link>
        </div>
      </section>

      <section id="faq" className="container" style={{ padding: "4.5rem 1.25rem", maxWidth: "42rem", scrollMarginTop: "5rem" }}>
        <p style={{ textAlign: "center", color: "var(--amber-600)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
          FAQ
        </p>
        <h2 style={{ textAlign: "center", fontSize: "clamp(1.45rem, 5vw, 1.9rem)", fontWeight: 700, marginBottom: "2rem" }}>
          Chicken sitting, answered.
        </h2>
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {FAQS.map((faq, i) => (
            <FaqItem key={faq.q} faq={faq} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: "Chicken sitting",
            name: "Roost Assured",
            description: "Backyard chicken sitting: feeding, egg collection, and coop care from background-checked local sitters.",
            areaServed: "United States",
            provider: { "@type": "Organization", name: "Roost Assured", url: "https://roostassured.com" },
          }),
        }}
      />
    </>
  )
}

export default function Home() {
  const { user, setUser } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const referredByCode = searchParams.get("ref")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [careRequestOpen, setCareRequestOpen] = useState(false)
  const [bids, setBids] = useState([])
  const [bidActionId, setBidActionId] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [requestsError, setRequestsError] = useState(null)
  const [requestsNotice, setRequestsNotice] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)

  const load = async () => {
    setLoading(true)
    const result = await api.get("/home")
    setData(result)
    setLoading(false)
  }

  const loadBids = () => {
    api.get("/bids").then((r) => setBids(r.bids))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (user) loadBids()
  }, [user])

  const hasAcceptedBid = bids.some((b) => b.status === "accepted")
  const submittedBids = bids.filter((b) => b.status === "submitted")
  const completedBids = bids.filter((b) => b.status === "accepted" && b.job_status === "completed")
  const activeBids = bids.filter((b) => !(b.status === "accepted" && b.job_status === "completed"))

  const handleCancelRequest = async () => {
    if (!window.confirm("Cancel your open sitting request? Any pending bids will be removed.")) return
    setCancelling(true)
    setRequestsError(null)
    setRequestsNotice(null)
    try {
      const result = await api.delete("/sitting_request")
      setUser(result.user)
      setBids([])
      setRequestsNotice("Request cancelled.")
    } catch (err) {
      setRequestsError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setCancelling(false)
    }
  }

  const handleBidDecision = async (bidId, action) => {
    setBidActionId(bidId)
    setRequestsError(null)
    setRequestsNotice(null)
    try {
      const result = await api.post(`/bids/${bidId}/${action}`)
      setBids(result.bids)
      setRequestsNotice(action === "accept" ? "Bid accepted." : "Bid rejected.")
    } catch (err) {
      setRequestsError(err.data?.errors?.join(", ") || "Something went wrong.")
    } finally {
      setBidActionId(null)
    }
  }

  const handleRateBid = async (bidId, rating, review) => {
    setRequestsError(null)
    setRequestsNotice(null)
    try {
      const result = await api.post(`/bids/${bidId}/rate`, { bid: { rating, review } })
      setBids(result.bids)
      setRequestsNotice("Thanks for the feedback!")
    } catch (err) {
      setRequestsError(err.data?.errors?.join(", ") || "Something went wrong.")
    }
  }

  const handleJobUpdate = (bidId, jobData) => {
    setBids((prev) => prev.map((b) => (b.id === bidId ? { ...b, ...jobData } : b)))
  }

  const handleBlockedSitter = (sitterUserId) => {
    setBids((prev) => prev.filter((b) => b.sitter.user_id !== sitterUserId))
  }

  useSeo({
    title: "Roost Assured – Trusted Chicken Sitters Near You",
    description: "Find a background-checked chicken sitter near you for feeding, egg collection, and coop care while you travel. Search your ZIP code to see who's available.",
  })

  useEffect(() => {
    if (loading || !location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }, [loading, location.hash])

  if (loading || !data) {
    return <section className="container" style={{ paddingTop: "6rem", textAlign: "center" }}>Loading…</section>
  }

  const {
    searched_city, searched_state, searched_zip, zip_is_live,
    sitting_window_asked, confirmed_signup, available_sitters, nearby_sitters
  } = data

  const referralFormShown = referredByCode && !searched_zip

  return (
    <>
    <section className="container" style={{ paddingTop: "6rem", paddingBottom: "5rem", textAlign: "center" }}>
      {user ? (
        <>
          <p style={{ color: "var(--amber-600)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.875rem" }}>Welcome back</p>
          <h1 style={{ fontSize: "clamp(1.6rem, 6vw, 2.25rem)", fontWeight: 700 }}>Good to see you, {user.name}.</h1>
          <p style={{ fontSize: "1.125rem", color: "var(--text-muted)", maxWidth: "36rem", margin: "1.5rem auto" }}>
            {user.sitting_dates?.length > 0
              ? `Your request is in — ${user.sitting_dates.length} day${user.sitting_dates.length === 1 ? "" : "s"} of care requested. We'll email you as soon as a sitter nearby is ready to connect.`
              : "Your account is set up. Add your sitting dates so nearby sitters know when you need help."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={() => setCareRequestOpen(true)}>New care request</button>
            {user.sitter && <Link to="/job_requests" className="btn btn-outline">Sitter Openings</Link>}
          </div>
        </>
      ) : confirmed_signup ? (
        <>
          <p style={{ color: "var(--amber-600)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.875rem" }}>You're on the list</p>
          <h1 style={{ fontSize: "clamp(1.85rem, 7vw, 2.75rem)", fontWeight: 700 }}>Going out of town?<br />Your flock still needs a keeper.</h1>
          <p style={{ fontSize: "1.125rem", color: "var(--stone-600)", maxWidth: "36rem", margin: "1.5rem auto" }}>
            Roost Assured connects backyard chicken owners with trusted local sitters — feeding, egg
            collection, and coop care while you're away.
          </p>

          {available_sitters.length > 0 && (
            <>
              <p style={{ background: "var(--emerald-100)", color: "var(--emerald-900)", fontSize: "0.875rem", borderRadius: "0.5rem", padding: "0.75rem 1rem", maxWidth: "28rem", margin: "0 auto 1.5rem" }}>
                🎉 Good news — <strong>{available_sitters.length} sitter{available_sitters.length === 1 ? "" : "s"}</strong> already
                active near {confirmed_signup.city}, {confirmed_signup.state}. We'll reach out by email to help make the connection.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {available_sitters.slice(0, 6).map((sitter) => (
                  <Link key={sitter.id} to={`/sitters/${sitter.id}`} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "999px", padding: "0.375rem 1rem 0.375rem 0.75rem", fontSize: "0.875rem", textDecoration: "none" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--brand-amber)" }}>
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
                    </svg>
                    <span style={{ fontWeight: 600 }}>{sitter.name}</span>
                    <span style={{ color: "var(--stone-500)" }}>${Math.round(sitter.price_per_visit)}/visit</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div style={{ marginBottom: "2.5rem" }}>
            <WaitlistForm
              initial={{ city: confirmed_signup.city, state: confirmed_signup.state, zip_code: confirmed_signup.zip_code }}
              referralCode={confirmed_signup.referral_code}
              onSuccess={load}
            />
          </div>
        </>
      ) : zip_is_live ? (
        <>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "4rem", height: "4rem", margin: "0 auto 1.5rem", borderRadius: "9999px",
              background: "var(--brand-dark)", color: "var(--brand-amber)",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p style={{ color: "var(--amber-600)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.875rem" }}>Good news</p>
          <h1 style={{ fontSize: "clamp(1.85rem, 7vw, 2.75rem)", fontWeight: 700 }}>
            {nearby_sitters.length > 0
              ? <>There are flock keepers available near {searched_city}, {searched_state}.</>
              : <>Roost Assured is live in {searched_city}, {searched_state}.</>}
          </h1>
          <p style={{ fontSize: "1.125rem", color: "var(--stone-600)", maxWidth: "36rem", margin: "1.5rem auto" }}>
            {nearby_sitters.length > 0
              ? <>Congratulations — you're in an active area. Create your free account to see who's nearby and book a visit.</>
              : <>Create your free account to find a local sitter or start sitting for neighbors near you — no waitlist required.</>}
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/signup" className="btn btn-primary">Continue</Link>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <button
              className="btn"
              style={{ background: "transparent", border: 0, padding: 0, color: "var(--amber-700)", textDecoration: "underline", cursor: "pointer", fontSize: "0.875rem" }}
              onClick={async () => { await api.delete("/zip_search"); load() }}
            >
              Search a different ZIP
            </button>
          </div>
        </>
      ) : searched_zip && !sitting_window_asked ? (
        <>
          <p style={{ color: "var(--amber-600)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.875rem" }}>Almost there</p>
          <h1 style={{ fontSize: "clamp(1.85rem, 7vw, 2.75rem)", fontWeight: 700 }}>Let's find sitters near {searched_city}, {searched_state}.</h1>
          <p style={{ fontSize: "1.125rem", color: "var(--stone-600)", maxWidth: "36rem", margin: "1.5rem auto" }}>
            First, let us know when you're looking for coverage.
          </p>
          <SittingWindowForm onSuccess={load} />
        </>
      ) : searched_zip ? (
        <>
          <p style={{ color: "var(--amber-600)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.875rem" }}>Almost there</p>
          <h1 style={{ fontSize: "clamp(1.85rem, 7vw, 2.75rem)", fontWeight: 700 }}>No sitters near {searched_city}, {searched_state} yet.</h1>
          <p style={{ fontSize: "1.125rem", color: "var(--stone-600)", maxWidth: "36rem", margin: "1.5rem auto" }}>
            Enter your email and we'll let you know the moment Roost Assured has sitters (or owners) near you.
          </p>
          <WaitlistForm initial={{ city: searched_city, state: searched_state, zip_code: searched_zip }} lockZip onSuccess={load} />
          <p style={{ color: "var(--stone-600)", fontSize: "0.875rem", maxWidth: "28rem", margin: "1.5rem auto 0" }}>
            Keep chickens yourself and free most days? <Link to="/signup" style={{ color: "var(--amber-700)" }}>Create an account</Link> and apply to be a sitter instead.
          </p>
        </>
      ) : referralFormShown ? (
        <>
          <p style={{ color: "var(--amber-600)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.875rem" }}>Almost there</p>
          <h1 style={{ fontSize: "clamp(1.85rem, 7vw, 2.75rem)", fontWeight: 700 }}>Going out of town?<br />Your flock still needs a keeper.</h1>
          <p style={{ fontSize: "1.125rem", color: "var(--stone-600)", maxWidth: "36rem", margin: "1.5rem auto" }}>
            Enter your email and we'll let you know the moment Roost Assured has sitters (or owners) near you.
          </p>
          <WaitlistForm referralCode={referredByCode} onSuccess={load} />
        </>
      ) : (
        <>
          <p style={{ color: "var(--amber-600)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.875rem" }}>Backyard chicken sitting, made simple</p>
          <h1 style={{ fontSize: "clamp(1.85rem, 7vw, 2.75rem)", fontWeight: 700, lineHeight: 1.15 }}>Find a trusted chicken sitter near you.</h1>
          <p style={{ fontSize: "1.125rem", color: "var(--stone-600)", maxWidth: "36rem", margin: "1.5rem auto" }}>
            Roost Assured connects backyard chicken owners with background-checked local sitters for
            feeding, egg collection, and coop care. Enter your ZIP code to see what's happening in your area.
          </p>
          <ZipSearchForm onSuccess={load} />
          <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap", marginTop: "2rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--brand-amber)" }}><path d="M20 6 9 17l-5-5" /></svg>
              Background-checked sitters
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--brand-amber)" }}><path d="M20 6 9 17l-5-5" /></svg>
              Photo updates every visit
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--brand-amber)" }}><path d="M20 6 9 17l-5-5" /></svg>
              No subscriptions, pay per visit
            </span>
          </div>
        </>
      )}
    </section>

    {!user && <MarketingSections />}

    {user && user.sitting_dates?.length > 0 && (
      <section className="container" style={{ paddingBottom: "3.5rem" }}>
        <div style={{ maxWidth: "34rem", margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.35rem" }}>Requests</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>Bids sitters have submitted on your open request.</p>

          {requestsNotice && <p className="flash flash-notice">{requestsNotice}</p>}
          {requestsError && <p className="flash flash-alert">{requestsError}</p>}

          {submittedBids.length > 0 && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: "0.6rem", background: "var(--amber-50)", color: "var(--amber-700)",
                borderRadius: "0.6rem", padding: "0.75rem 1rem", marginBottom: "1.1rem", fontSize: "0.88rem", fontWeight: 600,
              }}
            >
              <span style={{ fontSize: "1.15rem", lineHeight: 1 }}>🔔</span>
              {submittedBids.length === 1
                ? "You have a new bid to review below."
                : `You have ${submittedBids.length} new bids to review below.`}
            </div>
          )}

          {bids.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No offers yet — check back once your request has been posted for a bit.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {activeBids.map((bid) => (
                <BidCard
                  key={bid.id} bid={bid} user={user} bidActionId={bidActionId}
                  onDecide={handleBidDecision} onRate={handleRateBid} onJobUpdate={handleJobUpdate}
                  onEditRequest={() => setCareRequestOpen(true)} onBlocked={handleBlockedSitter}
                />
              ))}
            </div>
          )}

          {completedBids.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <button
                type="button" onClick={() => setShowCompleted(!showCompleted)}
                style={{ background: "transparent", border: 0, color: "var(--text-muted)", fontSize: "0.85rem", cursor: "pointer", padding: 0, textDecoration: "underline" }}
              >
                {showCompleted ? "Hide" : "Show"} completed requests ({completedBids.length})
              </button>

              {showCompleted && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.75rem" }}>
                  {completedBids.map((bid) => (
                    <BidCard
                      key={bid.id} bid={bid} user={user} bidActionId={bidActionId}
                      onDecide={handleBidDecision} onRate={handleRateBid} onJobUpdate={handleJobUpdate}
                      onBlocked={handleBlockedSitter}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
            {hasAcceptedBid ? (
              <p className="hint-sm">
                You've accepted a sitter's bid for this request, so it can't be cancelled here. Reach out if plans change.
              </p>
            ) : (
              <>
                <p className="hint-sm" style={{ marginBottom: "0.6rem" }}>
                  Changed your mind? You can cancel this request as long as you haven't accepted a bid yet.
                </p>
                <button type="button" onClick={handleCancelRequest} className="btn btn-outline" disabled={cancelling} style={{ width: "100%" }}>
                  {cancelling ? "Cancelling…" : "Cancel request"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    )}

    {careRequestOpen && (
      <CareRequestModal
        user={user}
        onClose={() => setCareRequestOpen(false)}
        onSuccess={(updatedUser) => {
          setUser(updatedUser)
          setCareRequestOpen(false)
        }}
      />
    )}
    </>
  )
}
