import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import { STATES, FLOCK_SIZE_TIERS, COOP_FEATURES, SITTING_TYPES, CARE_TASKS } from "../lib/flockOptions"
import Checklist from "../components/Checklist"
import Stepper from "../components/Stepper"
import CalendarPicker from "../components/CalendarPicker"

const STEPS = ["Location", "Chicken math", "Coop type", "Sitting type", "Care tasks", "Feed & water setup", "Special requests", "Account", "Sitting dates"]
const LAST_STEP = STEPS.length - 1
const ACCOUNT_STEP = 7
const DATES_STEP = 8

const initialForm = {
  city: "", state: "", zip_code: "",
  flock_size_tier: "", coop_features: [], sitting_type: "",
  care_tasks: [], other_care_task: "",
  feeder_count: "", waterer_count: "", feed_location: "", water_location: "",
  special_requests: "",
  name: "", email_address: "", phone_number: "", address: "", password: "", password_confirmation: "",
  sitting_dates: [],
}

export default function Signup() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const selectField = (name, value) => setForm({ ...form, [name]: value })
  const toggleInList = (name, value) => {
    const list = form[name]
    setForm({ ...form, [name]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] })
  }
  const adjustCount = (name, delta) => {
    const current = parseInt(form[name], 10) || 0
    setForm({ ...form, [name]: String(Math.max(0, current + delta)) })
  }

  const validateStep = () => {
    if (step === 0 && (!form.city || !form.state || !form.zip_code)) return "Please fill in your city, state, and ZIP code."
    if (step === ACCOUNT_STEP) {
      if (!form.name || !form.email_address || !form.phone_number || !form.address || !form.password || !form.password_confirmation) {
        return "Please fill in every field."
      }
      if (form.password !== form.password_confirmation) return "Passwords don't match."
    }
    return null
  }

  const goNext = () => {
    const error = validateStep()
    if (error) return setErrors([error])
    setErrors([])
    setStep(step + 1)
  }

  const goBack = () => {
    setErrors([])
    setStep(Math.max(step - 1, 0))
  }

  const createAccount = async () => {
    const error = validateStep()
    if (error) return setErrors([error])

    setSubmitting(true)
    setErrors([])
    try {
      const { sitting_dates, ...rest } = form
      const result = await api.post("/registration", { user: rest })
      setUser(result.user)
      setErrors([])
      setStep(DATES_STEP)
    } catch (err) {
      setErrors(err.data?.errors || ["Something went wrong."])
    } finally {
      setSubmitting(false)
    }
  }

  const saveSittingDates = async () => {
    setSubmitting(true)
    setErrors([])
    try {
      const result = await api.patch("/account", { user: { sitting_dates: form.sitting_dates } })
      setUser(result.user)
      navigate("/")
    } catch (err) {
      setErrors(err.data?.errors || ["Something went wrong."])
    } finally {
      setSubmitting(false)
    }
  }

  const skipSittingDates = () => navigate("/")

  const close = () => navigate("/")

  const onFormSubmit = (e) => {
    e.preventDefault()
    if (step === ACCOUNT_STEP) {
      createAccount()
    } else if (step === DATES_STEP) {
      saveSittingDates()
    } else {
      goNext()
    }
  }

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, background: "rgba(28, 25, 23, 0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem", zIndex: 50, overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg)", borderRadius: "1rem", width: "100%", maxWidth: "28rem",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)", overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem 0" }}>
          <div style={{ display: "flex", gap: "0.28rem", flexWrap: "wrap", maxWidth: "14rem" }}>
            {STEPS.map((label, i) => (
              <div
                key={label}
                style={{
                  flex: 1, minWidth: "0.7rem", height: "0.3rem", borderRadius: "999px",
                  background: i <= step ? "var(--brand-amber)" : "var(--border)",
                }}
              />
            ))}
          </div>
          <button
            onClick={close}
            aria-label="Close"
            style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)", padding: "0.25rem" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onFormSubmit} style={{ padding: "1.25rem 1.5rem 1.75rem" }}>
          {errors.length > 0 && <p className="flash flash-alert" style={{ textAlign: "left", borderRadius: "0.5rem", marginTop: 0 }}>{errors.join(", ")}</p>}

          <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)", margin: "0 0 0.4rem" }}>
            Step {step + 1} of {STEPS.length}
          </p>

          {step === 0 && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>Where do you roost?</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>We'll use this to find sitters near your flock.</p>
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" name="city" value={form.city} onChange={handleChange} autoFocus required />
              </div>
              <div className="field">
                <label htmlFor="state">State</label>
                <select id="state" name="state" value={form.state} onChange={handleChange}>
                  <option value="">Select a state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="zip_code">ZIP code</label>
                <input id="zip_code" name="zip_code" value={form.zip_code} onChange={handleChange} required />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>What's your chicken math?</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>Pick the size that's closest to your flock today.</p>
              <div className="size-cards">
                {FLOCK_SIZE_TIERS.map((tier) => {
                  const selected = form.flock_size_tier === tier.value
                  return (
                    <button
                      key={tier.value} type="button" className={`size-card${selected ? " selected" : ""}`}
                      onClick={() => selectField("flock_size_tier", tier.value)} aria-pressed={selected}
                    >
                      <div>
                        <div className="name-row"><span className="name">{tier.value}</span><span className="range">{tier.range}</span></div>
                        <div className="desc">{tier.description}</div>
                      </div>
                      <span className="check">{selected ? "✓" : ""}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>What's your coop setup?</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>Select everything that applies.</p>
              <Checklist options={COOP_FEATURES} value={form.coop_features} onToggle={(v) => toggleInList("coop_features", v)} />
            </>
          )}

          {step === 3 && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.1rem" }}>What kind of help do you need?</h1>
              <div className="choice-cards">
                {SITTING_TYPES.map((option) => {
                  const selected = form.sitting_type === option.value
                  return (
                    <button
                      key={option.value} type="button" className={`choice-card${selected ? " selected" : ""}`}
                      onClick={() => selectField("sitting_type", option.value)} aria-pressed={selected}
                    >
                      <span className="name">{option.value}</span>
                      <span className="desc">{option.description}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>What would you like help with?</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>Build the visit checklist your sitter will follow — check off everything that applies to your flock.</p>
              <Checklist options={CARE_TASKS} value={form.care_tasks} onToggle={(v) => toggleInList("care_tasks", v)} />
              <div className="field" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
                <label htmlFor="other_care_task">Other</label>
                <input id="other_care_task" name="other_care_task" value={form.other_care_task} onChange={handleChange} placeholder="Something else a sitter should handle" />
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.1rem" }}>Feed &amp; water setup</h1>
              <div style={{ display: "flex", gap: "0.9rem" }}>
                <div className="field" style={{ flex: 1 }}>
                  <label>Feeders</label>
                  <Stepper value={form.feeder_count} onChange={(delta) => adjustCount("feeder_count", delta)} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Waterers</label>
                  <Stepper value={form.waterer_count} onChange={(delta) => adjustCount("waterer_count", delta)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="feed_location">Where's the feed kept?</label>
                <input id="feed_location" name="feed_location" value={form.feed_location} onChange={handleChange} placeholder="Metal bin in the garage, left of the door" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="water_location">Where's the water source?</label>
                <input id="water_location" name="water_location" value={form.water_location} onChange={handleChange} placeholder="Hose bib on the side of the coop" />
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>Anything else a sitter should know?</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>Mention predators in the area, aggressive roosters, or other hazards a sitter should be prepared for.</p>
              <div className="field" style={{ marginBottom: 0 }}>
                <textarea
                  id="special_requests" name="special_requests" rows={4}
                  value={form.special_requests} onChange={handleChange}
                  placeholder="We've had hawks circling this spring, and Big Red (our rooster) doesn't love strangers."
                />
              </div>
            </>
          )}

          {step === ACCOUNT_STEP && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.1rem" }}>Create your account</h1>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} autoFocus />
              </div>
              <div className="field">
                <label htmlFor="email_address">Email</label>
                <input id="email_address" type="email" name="email_address" value={form.email_address} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="phone_number">Phone number</label>
                <input id="phone_number" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="(503) 555-0148" required />
              </div>
              <div className="field">
                <label htmlFor="address">Street address</label>
                <input id="address" name="address" value={form.address} onChange={handleChange} placeholder="1420 SE Hawthorne Blvd" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" name="password" value={form.password} onChange={handleChange} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="password_confirmation">Confirm password</label>
                <input id="password_confirmation" type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} />
              </div>
            </>
          )}

          {step === DATES_STEP && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>When do you need a sitter?</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>Your account is set up — click days on the calendar, or use the fields on the right to fill a range. You can always change this later.</p>
              <CalendarPicker
                selectedDates={form.sitting_dates}
                onChange={(dates) => setForm({ ...form, sitting_dates: dates })}
              />
            </>
          )}

          <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.5rem" }}>
            {step > 0 && step < DATES_STEP && (
              <button type="button" className="btn btn-outline" onClick={goBack} disabled={submitting}>
                Back
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
              {step === ACCOUNT_STEP
                ? (submitting ? "Creating account…" : "Create account")
                : step === DATES_STEP
                  ? (submitting ? "Saving…" : "Save dates")
                  : "Continue"}
            </button>
          </div>
          {step === DATES_STEP && (
            <button
              type="button" onClick={skipSittingDates} disabled={submitting}
              style={{ background: "transparent", border: 0, color: "var(--amber-700)", textDecoration: "underline", cursor: "pointer", width: "100%", marginTop: "0.75rem", fontSize: "0.85rem" }}
            >
              Skip for now
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
