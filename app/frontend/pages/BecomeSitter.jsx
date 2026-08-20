import React from "react"
import { Link } from "react-router-dom"
import useSeo from "../hooks/useSeo"

const iconProps = {
  width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round",
}

const STEPS = [
  {
    step: "1",
    title: "Create a free account",
    description: "Sign up with your email — no cost to browse or apply.",
  },
  {
    step: "2",
    title: "Submit your sitter application",
    description: "Tell us about your experience, availability, and the coop care you're comfortable handling.",
  },
  {
    step: "3",
    title: "Pay the $50 application fee",
    description: "A one-time, non-refundable fee that covers the cost of your background check and processing — charged when you submit.",
  },
  {
    step: "4",
    title: "Complete your background check",
    description: "Checkr, our third-party screening partner, emails you a secure link to finish your check on their own hosted portal. Roost Assured never sees your SSN or date of birth.",
  },
  {
    step: "5",
    title: "Get approved and start bidding",
    description: "Once your application clears, you can browse open care requests near you and submit bids on the ones that fit your schedule.",
  },
]

const REQUIREMENTS = [
  {
    title: "Pass a background check",
    description: "Every sitter is screened by Checkr before they're approved to bid on a flock.",
    icon: (
      <svg {...iconProps}><path d="M12 3.5 5 6v6c0 4.2 3 7.3 7 8.5 4-1.2 7-4.3 7-8.5V6l-7-2.5Z" /><path d="m9 12 2 2 4-4" /></svg>
    ),
  },
  {
    title: "Comfortable around chickens",
    description: "You don't need to own chickens yourself, but you should be comfortable feeding, watering, and handling a flock.",
    icon: (
      <svg {...iconProps}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" /></svg>
    ),
  },
  {
    title: "Reliable availability",
    description: "Set the days and times you're free — you only get matched to requests that fit your schedule.",
    icon: (
      <svg {...iconProps}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
    ),
  },
]

export default function BecomeSitter() {
  useSeo({
    title: "Become a Chicken Sitter – Roost Assured",
    description: "Learn how to become a background-checked chicken sitter on Roost Assured: the application process, requirements, fees, and how bidding works.",
  })

  return (
    <>
      <section className="container" style={{ paddingTop: "5rem", paddingBottom: "3.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--amber-600)", fontWeight: 600, textTransform: "uppercase", fontSize: "0.875rem" }}>
          Earn money caring for flocks
        </p>
        <h1 style={{ fontSize: "clamp(1.85rem, 6vw, 2.5rem)", fontWeight: 700, lineHeight: 1.15 }}>
          Become a background-checked chicken sitter.
        </h1>
        <p style={{ fontSize: "1.1rem", color: "var(--stone-600)", maxWidth: "34rem", margin: "1.25rem auto 2rem" }}>
          Set your own rates, choose the requests that fit your schedule, and get paid for feeding, egg
          collection, and coop care — no long-term commitment required.
        </p>
        <Link to="/signup" className="btn btn-primary">Apply to sit</Link>
      </section>

      <section style={{ background: "var(--card-bg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ padding: "3.5rem 1.25rem" }}>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.45rem, 5vw, 1.9rem)", fontWeight: 700, marginBottom: "2.5rem" }}>
            How the application process works.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "34rem", margin: "0 auto" }}>
            {STEPS.map((item) => (
              <div key={item.step} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", width: "2.25rem", height: "2.25rem",
                    flexShrink: 0, borderRadius: "999px", background: "var(--brand-dark)", color: "var(--brand-amber)",
                    fontWeight: 700, fontSize: "0.95rem", border: "1px solid var(--border)",
                  }}
                >
                  {item.step}
                </div>
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ fontWeight: 700, marginBottom: "0.3rem" }}>{item.title}</h3>
                  <p style={{ color: "var(--stone-600)", fontSize: "0.92rem", lineHeight: 1.6 }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "4.5rem 1.25rem" }}>
        <h2 style={{ textAlign: "center", fontSize: "clamp(1.45rem, 5vw, 1.9rem)", fontWeight: 700, marginBottom: "0.75rem" }}>
          What it takes to get approved.
        </h2>
        <p style={{ textAlign: "center", color: "var(--stone-600)", fontSize: "0.95rem", maxWidth: "30rem", margin: "0 auto 2.75rem" }}>
          We keep the bar simple, but every applicant goes through the same screening.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "1.5rem" }}>
          {REQUIREMENTS.map((req) => (
            <div key={req.title} className="service-card">
              <div
                style={{
                  display: "flex", justifyContent: "center", alignItems: "center", width: "3.25rem", height: "3.25rem",
                  marginBottom: "1rem", borderRadius: "0.65rem", background: "var(--brand-dark)", color: "var(--brand-amber)",
                }}
              >
                {req.icon}
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{req.title}</h3>
              <p style={{ color: "var(--stone-600)", fontSize: "0.875rem", lineHeight: 1.6 }}>{req.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--brand-dark)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ padding: "3.5rem 1.25rem", maxWidth: "36rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(1.3rem, 4vw, 1.6rem)", fontWeight: 700, marginBottom: "0.75rem", color: "var(--brand-cream)" }}>
            About the $50 application fee.
          </h2>
          <p style={{ color: "#b7ab98", fontSize: "0.95rem", lineHeight: 1.7 }}>
            Roost Assured charges a one-time, non-refundable $50 fee when you submit your sitter application. It
            covers the cost of your background check plus the time it takes our team to review your application —
            whether or not you're ultimately approved. You'll enter payment details securely through Stripe, and your
            background check itself happens on Checkr's own hosted portal, so Roost Assured never collects your
            Social Security number or date of birth directly.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: "4.5rem 1.25rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(1.45rem, 5vw, 1.9rem)", fontWeight: 700, marginBottom: "0.75rem" }}>
          Ready to get started?
        </h2>
        <p style={{ color: "var(--stone-600)", fontSize: "0.95rem", maxWidth: "28rem", margin: "0 auto 1.75rem" }}>
          Create your free account, and you can submit a sitter application whenever you're ready.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/signup" className="btn btn-primary">Apply to sit</Link>
          <Link to="/#faq" className="btn btn-outline">Read the FAQ</Link>
        </div>
      </section>
    </>
  )
}
