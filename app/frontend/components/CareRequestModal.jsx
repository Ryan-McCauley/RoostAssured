import React, { useState } from "react"
import { api } from "../lib/api"
import { CARE_TASKS, STATES } from "../lib/flockOptions"
import Checklist from "./Checklist"
import CalendarPicker from "./CalendarPicker"

export default function CareRequestModal({ user, onClose, onSuccess }) {
  const isEditing = user.sitting_dates?.length > 0
  const needsContactInfo = !user.phone_number || !user.address || !user.city || !user.state || !user.zip_code
  const STEPS = needsContactInfo
    ? ["Contact & address", "Care tasks", "Special requests", "Sitting dates"]
    : ["Care tasks", "Special requests", "Sitting dates"]
  const LAST_STEP = STEPS.length - 1
  const CONTACT_STEP = needsContactInfo ? 0 : null
  const stepOffset = needsContactInfo ? 1 : 0

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    phone_number: user.phone_number || "",
    address: user.address || "",
    city: user.city || "",
    state: user.state || "",
    zip_code: user.zip_code || "",
    care_tasks: user.care_tasks || [],
    other_care_task: user.other_care_task || "",
    special_requests: user.special_requests || "",
    sitting_dates: user.sitting_dates || [],
  })
  const [errors, setErrors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const toggleInList = (name, value) => {
    const list = form[name] || []
    setForm({ ...form, [name]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] })
  }

  const validateStep = () => {
    if (step === CONTACT_STEP && (!form.phone_number || !form.address || !form.city || !form.state || !form.zip_code)) {
      return "Please fill in your phone number and address so a sitter can reach you."
    }
    return null
  }

  const goNext = () => {
    const error = validateStep()
    if (error) return setErrors([error])
    setErrors([])
    setStep(Math.min(step + 1, LAST_STEP))
  }
  const goBack = () => { setErrors([]); setStep(Math.max(step - 1, 0)) }

  const handleSubmit = async () => {
    const error = validateStep()
    if (error) return setErrors([error])

    setSubmitting(true)
    setErrors([])
    try {
      const result = await api.patch("/account", { user: form })
      onSuccess(result.user)
    } catch (err) {
      setErrors(err.data?.errors || ["Something went wrong."])
    } finally {
      setSubmitting(false)
    }
  }

  const onFormSubmit = (e) => {
    e.preventDefault()
    if (step < LAST_STEP) {
      goNext()
    } else {
      handleSubmit()
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
            onClick={onClose}
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

          {step === CONTACT_STEP && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>Confirm your contact info</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>A sitter needs this to actually show up — we'll save it to your profile.</p>
              <div className="field">
                <label htmlFor="phone_number">Phone number</label>
                <input id="phone_number" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="(503) 555-0148" required autoFocus />
              </div>
              <div className="field">
                <label htmlFor="address">Street address</label>
                <input id="address" name="address" value={form.address} onChange={handleChange} placeholder="1420 SE Hawthorne Blvd" required />
              </div>
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" name="city" value={form.city} onChange={handleChange} required />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="state">State</label>
                  <select id="state" name="state" value={form.state} onChange={handleChange} required>
                    <option value="">–</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="zip_code">ZIP code</label>
                  <input id="zip_code" name="zip_code" value={form.zip_code} onChange={handleChange} required />
                </div>
              </div>
            </>
          )}

          {step === stepOffset + 0 && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>New care request</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>Build the visit checklist your sitter will follow — check off everything that applies to your flock.</p>
              <Checklist options={CARE_TASKS} value={form.care_tasks} onToggle={(v) => toggleInList("care_tasks", v)} />
              <div className="field" style={{ marginTop: "0.9rem", marginBottom: 0 }}>
                <label htmlFor="other_care_task">Other</label>
                <input id="other_care_task" name="other_care_task" value={form.other_care_task} onChange={handleChange} placeholder="Something else a sitter should handle" />
              </div>
            </>
          )}

          {step === stepOffset + 1 && (
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

          {step === LAST_STEP && (
            <>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.35rem" }}>When do you need a sitter?</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>Click days on the calendar, or use the fields on the right to fill a range.</p>
              <CalendarPicker
                selectedDates={form.sitting_dates}
                onChange={(dates) => setForm({ ...form, sitting_dates: dates })}
              />
            </>
          )}

          <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.5rem" }}>
            {step > 0 && (
              <button type="button" className="btn btn-outline" onClick={goBack} disabled={submitting}>
                Back
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
              {step < LAST_STEP ? "Continue" : (submitting ? "Submitting…" : "Submit request")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
