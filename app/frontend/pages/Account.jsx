import React, { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import { FLOCK_SIZE_TIERS, COOP_FEATURES, SITTING_TYPES, CARE_TASKS, STATES, AVAILABILITY_DAYS, AVAILABILITY_TIMES } from "../lib/flockOptions"
import Checklist from "../components/Checklist"
import Stepper from "../components/Stepper"
import CalendarPicker from "../components/CalendarPicker"
import StripeCardForm from "../components/StripeCardForm"
import Tooltip from "../components/Tooltip"

let stripePromise = null
function getStripe(publishableKey) {
  if (!stripePromise && publishableKey) stripePromise = loadStripe(publishableKey)
  return stripePromise
}

const TRAVEL_RADII = [5, 10, 15, 20, 25, 50]

const SECTIONS = [
  { key: "profile", label: "Profile" },
  { key: "flock", label: "Flock & coop" },
  { key: "dates", label: "Sitting dates" },
  { key: "payment", label: "Payment method" },
  { key: "sitter", label: "Become a sitter" },
]

// Covers the cost of the Checkr background check itself plus processing — update this if Checkr's
// package price or Stripe's fees change enough to erode the margin.
const BACKGROUND_CHECK_FEE = 50

function BackgroundCheckNotice() {
  return (
    <p className="hint-sm" style={{ background: "var(--field-bg)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.65rem 0.8rem", marginBottom: "0.9rem" }}>
      Background checks are run by our third-party partner, <strong>Checkr</strong>. Submitting your application
      charges a <strong>${BACKGROUND_CHECK_FEE} non-refundable application fee</strong>, which covers the cost of
      the check and processing. This fee applies whether or not your application is approved. Read the required{" "}
      <Link to="/background-check-disclosure" target="_blank" style={{ textDecoration: "underline" }}>
        Background Check Disclosure &amp; Authorization
      </Link>.
    </p>
  )
}

// Rendered inside <Elements> so it can collect card details for the (new-application-only)
// non-refundable application fee, then submit the application in the same request.
function SitterApplicationForm({
  sitterForm, application, handleSitterChange, toggleSitterList, handleResumeChange,
  buildApplicationFormData, onSubmitted, onError, clearNotice, sitterSubmitting, setSitterSubmitting,
}) {
  const stripe = useStripe()
  const elements = useElements()
  const isNewApplication = !application

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSitterSubmitting(true)
    onError([])
    clearNotice()
    try {
      const data = buildApplicationFormData()

      if (isNewApplication) {
        if (!stripe || !elements) return
        const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: elements.getElement(CardElement),
        })
        if (stripeError) {
          onError([stripeError.message])
          return
        }
        data.append("payment_method_id", paymentMethod.id)
      }

      const result = isNewApplication
        ? await api.post("/sitter_application", data)
        : await api.patch("/sitter_application", data)

      onSubmitted(result)
    } catch (err) {
      onError(err.data?.errors || ["Something went wrong."])
    } finally {
      setSitterSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="first_name">First name</label>
          <input id="first_name" name="first_name" value={sitterForm.first_name || ""} onChange={handleSitterChange} required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="middle_name">Middle name</label>
          <input id="middle_name" name="middle_name" value={sitterForm.middle_name || ""} onChange={handleSitterChange} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" name="last_name" value={sitterForm.last_name || ""} onChange={handleSitterChange} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="street_address">Street address</label>
        <input id="street_address" name="street_address" value={sitterForm.street_address || ""} onChange={handleSitterChange} placeholder="1420 SE Hawthorne Blvd" required />
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <div className="field" style={{ flex: 2 }}>
          <label htmlFor="app_city">City</label>
          <input id="app_city" name="city" value={sitterForm.city || ""} onChange={handleSitterChange} required />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="app_state">State</label>
          <select id="app_state" name="state" value={sitterForm.state || ""} onChange={handleSitterChange}>
            <option value="">–</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="app_zip">ZIP</label>
          <input id="app_zip" name="zip_code" value={sitterForm.zip_code || ""} onChange={handleSitterChange} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="price_per_visit">
          Price per visit ($)
          <Tooltip text="What you'd charge for a single visit. Owners see this rate when reviewing your bid, and you can still offer a different amount on individual job requests." />
        </label>
        <input id="price_per_visit" type="number" name="price_per_visit" value={sitterForm.price_per_visit || ""} onChange={handleSitterChange} required />
      </div>
      <div className="field">
        <label htmlFor="years_experience">Years of experience</label>
        <input id="years_experience" type="number" name="years_experience" value={sitterForm.years_experience || ""} onChange={handleSitterChange} />
      </div>
      <div className="field">
        <label htmlFor="travel_radius_miles">
          Travel radius (miles)
          <Tooltip text="The farthest you're willing to travel from your address to take a job. Requests outside this radius won't be shown to you." />
        </label>
        <select id="travel_radius_miles" name="travel_radius_miles" value={sitterForm.travel_radius_miles || 10} onChange={handleSitterChange}>
          {TRAVEL_RADII.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="field">
        <label>
          Weekday availability
          <Tooltip text="Used to match you with job requests that fit your schedule — pick every day you're generally free." />
        </label>
        <Checklist options={AVAILABILITY_DAYS} value={sitterForm.availability_days || []} onToggle={(v) => toggleSitterList("availability_days", v)} />
      </div>
      <div className="field">
        <label>Time of day</label>
        <Checklist options={AVAILABILITY_TIMES} value={sitterForm.availability_times || []} onToggle={(v) => toggleSitterList("availability_times", v)} />
      </div>

      <div className="field">
        <label htmlFor="bio">Why you're a great fit</label>
        <textarea id="bio" name="bio" rows={4} value={sitterForm.bio || ""} onChange={handleSitterChange} placeholder="Tell us about why you're a great fit." />
      </div>

      <div className="field">
        <label htmlFor="resume">
          Resume
          <Tooltip text="Optional but recommended — a PDF or Word doc (under 10MB) gives reviewers a fuller picture of your experience." />
        </label>
        <input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
        {sitterForm.resume_filename && !(sitterForm.resume instanceof File) && (
          <p className="hint-sm" style={{ marginTop: "0.35rem" }}>Currently on file: {sitterForm.resume_filename}</p>
        )}
      </div>

      <div className="field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input id="own_flock" type="checkbox" name="own_flock" checked={!!sitterForm.own_flock} onChange={handleSitterChange} style={{ width: "auto" }} />
        <label htmlFor="own_flock" style={{ marginBottom: 0 }}>
          I own my own flock
          <Tooltip text="Owners often prefer sitters with hands-on chicken-keeping experience — this shows up on your public profile if approved." />
        </label>
      </div>

      {isNewApplication && <BackgroundCheckNotice />}

      <div className="field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input id="background_check_consent" type="checkbox" name="background_check_consent" checked={!!sitterForm.background_check_consent} onChange={handleSitterChange} required style={{ width: "auto" }} />
        <label htmlFor="background_check_consent" style={{ marginBottom: 0 }}>
          {isNewApplication ? (
            <>
              I have read the{" "}
              <Link to="/background-check-disclosure" target="_blank" style={{ textDecoration: "underline" }}>
                Background Check Disclosure &amp; Authorization
              </Link>{" "}
              and authorize a background check
            </>
          ) : (
            "I consent to a background check"
          )}
          <Tooltip text={
            isNewApplication
              ? `Run by Checkr, a third-party background check provider. The $${BACKGROUND_CHECK_FEE} fee below is charged by Roost Assured when you submit and is non-refundable, even if your application isn't approved.`
              : "Run by Checkr, a third-party background check provider, as part of your application."
          } />
        </label>
      </div>

      {isNewApplication && (
        <div className="field">
          <label>
            Card details
            <Tooltip text={`Charged once, when you submit — covers the $${BACKGROUND_CHECK_FEE} non-refundable application fee.`} />
          </label>
          <div style={{ padding: "0.65rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.5rem" }}>
            <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
          </div>
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={sitterSubmitting || (isNewApplication && !stripe)} style={{ width: "100%" }}>
        {sitterSubmitting ? "Saving…" : isNewApplication ? `Pay $${BACKGROUND_CHECK_FEE} & submit application` : "Update application"}
      </button>
    </form>
  )
}

export default function Account() {
  const { user, loading, setUser } = useAuth()
  const navigate = useNavigate()
  const [section, setSection] = useState("profile")
  const [form, setForm] = useState(null)
  const [sitterForm, setSitterForm] = useState(null)
  const [availabilities, setAvailabilities] = useState([])
  const [newAvailability, setNewAvailability] = useState({ start_date: "", end_date: "" })
  const [errors, setErrors] = useState([])
  const [notice, setNotice] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sitterSubmitting, setSitterSubmitting] = useState(false)
  const [hasPaymentMethod, setHasPaymentMethod] = useState(null)
  const [onboardingLinkLoading, setOnboardingLinkLoading] = useState(false)
  const [publishableKey, setPublishableKey] = useState(null)

  useEffect(() => {
    if (!loading && !user) navigate("/login")
  }, [loading, user, navigate])

  const refreshPaymentMethod = () => {
    api.get("/stripe_payment_method").then((r) => {
      setHasPaymentMethod(r.has_payment_method)
      setPublishableKey(r.publishable_key)
    })
  }

  useEffect(() => { refreshPaymentMethod() }, [])

  const handleStripeOnboarding = async () => {
    setOnboardingLinkLoading(true)
    try {
      const { url } = await api.post("/stripe_account/onboarding_link")
      window.location.href = url
    } catch (err) {
      setErrors(err.data?.errors || ["Couldn't start onboarding. Try again."])
      setOnboardingLinkLoading(false)
    }
  }

  useEffect(() => {
    api.get("/account").then((r) => {
      setForm(r.user)
      setSitterForm(
        r.user.sitter || r.user.sitter_application || {
          first_name: "", middle_name: "", last_name: "",
          street_address: "", city: "", state: "", zip_code: "",
          bio: "", price_per_visit: "", years_experience: "", own_flock: false, travel_radius_miles: 10,
          availability_days: [], availability_times: [], background_check_consent: false,
        }
      )
      setAvailabilities(r.availabilities)
    })
  }, [])

  if (!form) return <section className="container" style={{ paddingTop: "4rem" }}>Loading…</section>

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const selectField = (name, value) => setForm({ ...form, [name]: value })
  const toggleInList = (name, value) => {
    const list = form[name] || []
    setForm({ ...form, [name]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] })
  }
  const adjustCount = (name, delta) => {
    const current = parseInt(form[name], 10) || 0
    setForm({ ...form, [name]: String(Math.max(0, current + delta)) })
  }

  const handleSitterChange = (e) => {
    const { name, type, checked, value } = e.target
    setSitterForm({ ...sitterForm, [name]: type === "checkbox" ? checked : value })
  }
  const toggleSitterList = (name, value) => {
    const list = sitterForm[name] || []
    setSitterForm({ ...sitterForm, [name]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] })
  }
  const handleResumeChange = (e) => setSitterForm({ ...sitterForm, resume: e.target.files[0] || null })
  const handleProfilePhotoChange = (e) => setSitterForm({ ...sitterForm, profile_photo: e.target.files[0] || null })

  const save = async (fields) => {
    setSubmitting(true)
    setErrors([])
    setNotice(null)
    try {
      const result = await api.patch("/account", { user: fields })
      setForm(result.user)
      setUser(result.user)
      setNotice("Saved.")
    } catch (err) {
      setErrors(err.data?.errors || ["Something went wrong."])
    } finally {
      setSubmitting(false)
    }
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    const { name, phone_number, address, city, state, zip_code } = form
    save({ name, phone_number, address, city, state, zip_code })
  }

  const handleFlockSubmit = (e) => {
    e.preventDefault()
    const {
      flock_size_tier, coop_features, sitting_type, care_tasks, other_care_task,
      feeder_count, waterer_count, feed_location, water_location, special_requests,
    } = form
    save({
      flock_size_tier, coop_features, sitting_type, care_tasks, other_care_task,
      feeder_count, waterer_count, feed_location, water_location, special_requests,
    })
  }

  const handleSaveDates = () => save({ sitting_dates: form.sitting_dates })

  const isSitter = !!form.sitter
  const application = form.sitter_application
  const applicationStatus = !isSitter && application ? application.status : null
  const missingContactInfo = !form.phone_number || !form.address || !form.city || !form.state || !form.zip_code

  const buildApplicationFormData = () => {
    const data = new FormData()
    const scalarFields = [
      "first_name", "middle_name", "last_name", "street_address", "city", "state", "zip_code",
      "bio", "price_per_visit", "years_experience", "travel_radius_miles",
    ]
    scalarFields.forEach((f) => data.append(`sitter_application[${f}]`, sitterForm[f] || ""))
    data.append("sitter_application[own_flock]", sitterForm.own_flock ? "1" : "0")
    data.append("sitter_application[background_check_consent]", sitterForm.background_check_consent ? "1" : "0")
    ;(sitterForm.availability_days || []).forEach((d) => data.append("sitter_application[availability_days][]", d))
    ;(sitterForm.availability_times || []).forEach((t) => data.append("sitter_application[availability_times][]", t))
    if (sitterForm.resume instanceof File) data.append("sitter_application[resume]", sitterForm.resume)
    return data
  }

  const buildSitterProfileFormData = () => {
    const data = new FormData()
    const scalarFields = ["bio", "price_per_visit", "years_experience", "travel_radius_miles"]
    scalarFields.forEach((f) => data.append(`sitter[${f}]`, sitterForm[f] || ""))
    data.append("sitter[own_flock]", sitterForm.own_flock ? "1" : "0")
    data.append("sitter[background_check_consent]", sitterForm.background_check_consent ? "1" : "0")
    if (sitterForm.profile_photo instanceof File) data.append("sitter[profile_photo]", sitterForm.profile_photo)
    return data
  }

  const handleSitterSubmit = async (e) => {
    e.preventDefault()
    setSitterSubmitting(true)
    setErrors([])
    setNotice(null)
    try {
      const result = await api.patch("/sitter_profile", buildSitterProfileFormData())
      setForm(result.user)
      setSitterForm(result.user.sitter || result.user.sitter_application)
      setUser(result.user)
      setNotice("Sitter profile updated.")
    } catch (err) {
      setErrors(err.data?.errors || ["Something went wrong."])
    } finally {
      setSitterSubmitting(false)
    }
  }

  const handleApplicationSubmitted = (result) => {
    setForm(result.user)
    setSitterForm(result.user.sitter || result.user.sitter_application)
    setUser(result.user)
    setNotice(application ? "Application updated." : "Application submitted — we'll email you once it's reviewed.")
  }

  const addAvailability = async (e) => {
    e.preventDefault()
    try {
      const result = await api.post("/availabilities", { availability: newAvailability })
      setAvailabilities(result.availabilities)
      setNewAvailability({ start_date: "", end_date: "" })
    } catch (err) {
      setErrors(err.data?.errors || ["Couldn't add availability."])
    }
  }

  const removeAvailability = async (id) => {
    const result = await api.delete(`/availabilities/${id}`)
    setAvailabilities(result.availabilities)
  }

  return (
    <section className="container" style={{ paddingTop: "3.5rem", paddingBottom: "4rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.35rem" }}>Account settings</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>Manage your profile, flock details, and sitting requests.</p>

      <div style={{ display: "grid", gridTemplateColumns: "14rem 1fr", gap: "2.5rem", alignItems: "start" }}>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => { setSection(s.key); setErrors([]); setNotice(null) }}
              style={{
                textAlign: "left", padding: "0.6rem 0.8rem", borderRadius: "0.5rem", border: "1px solid transparent",
                background: section === s.key ? "var(--amber-50)" : "transparent",
                color: section === s.key ? "var(--amber-700)" : "var(--text)",
                fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div style={{ maxWidth: "28rem" }}>
          {notice && <p className="flash flash-notice">{notice}</p>}
          {errors.length > 0 && <p className="flash flash-alert">{errors.join(", ")}</p>}

          {section === "profile" && (
            <form onSubmit={handleProfileSubmit}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem" }}>Profile</h2>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" value={form.name || ""} onChange={handleChange} required />
              </div>
              <div className="field">
                <label htmlFor="phone_number">Phone number</label>
                <input id="phone_number" name="phone_number" value={form.phone_number || ""} onChange={handleChange} placeholder="(503) 555-0148" />
              </div>
              <div className="field">
                <label htmlFor="address">Street address</label>
                <input id="address" name="address" value={form.address || ""} onChange={handleChange} placeholder="1420 SE Hawthorne Blvd" />
              </div>
              <div className="field">
                <label htmlFor="city">City</label>
                <input id="city" name="city" value={form.city || ""} onChange={handleChange} />
              </div>
              <div className="field">
                <label htmlFor="state">State</label>
                <input id="state" name="state" value={form.state || ""} onChange={handleChange} maxLength={2} />
              </div>
              <div className="field">
                <label htmlFor="zip_code">ZIP code</label>
                <input id="zip_code" name="zip_code" value={form.zip_code || ""} onChange={handleChange} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? "Saving…" : "Save changes"}
              </button>
            </form>
          )}

          {section === "flock" && (
            <form onSubmit={handleFlockSubmit}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem" }}>Flock &amp; coop</h2>

              <div className="field">
                <label>Chicken math</label>
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
              </div>

              <div className="field">
                <label>Coop setup</label>
                <Checklist options={COOP_FEATURES} value={form.coop_features || []} onToggle={(v) => toggleInList("coop_features", v)} />
              </div>

              <div className="field">
                <label>What kind of help do you need?</label>
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
              </div>

              <div className="field">
                <label>What should a sitter handle?</label>
                <Checklist options={CARE_TASKS} value={form.care_tasks || []} onToggle={(v) => toggleInList("care_tasks", v)} />
              </div>
              <div className="field">
                <label htmlFor="other_care_task">Other</label>
                <input id="other_care_task" name="other_care_task" value={form.other_care_task || ""} onChange={handleChange} placeholder="Something else a sitter should handle" />
              </div>

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
                <input id="feed_location" name="feed_location" value={form.feed_location || ""} onChange={handleChange} placeholder="Metal bin in the garage, left of the door" />
              </div>
              <div className="field">
                <label htmlFor="water_location">Where's the water source?</label>
                <input id="water_location" name="water_location" value={form.water_location || ""} onChange={handleChange} placeholder="Hose bib on the side of the coop" />
              </div>

              <div className="field">
                <label htmlFor="special_requests">Anything else a sitter should know?</label>
                <textarea
                  id="special_requests" name="special_requests" rows={4}
                  value={form.special_requests || ""} onChange={handleChange}
                  placeholder="Predators in the area, aggressive roosters, or other hazards a sitter should be prepared for."
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? "Saving…" : "Save flock & coop details"}
              </button>
            </form>
          )}

          {section === "dates" && (
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.35rem" }}>Sitting dates</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>Click days on the calendar, or use the fields on the right to fill a range.</p>
              {missingContactInfo && (
                <div className="flash flash-alert" style={{ textAlign: "left", borderRadius: "0.5rem", marginBottom: "1.1rem" }}>
                  Add your phone number and address on the{" "}
                  <button type="button" onClick={() => { setSection("profile"); setErrors([]); setNotice(null) }} style={{ background: "none", border: 0, padding: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit" }}>
                    Profile
                  </button>{" "}
                  tab before requesting a sitter — that's what a sitter uses to actually reach you.
                </div>
              )}
              <CalendarPicker
                selectedDates={form.sitting_dates || []}
                onChange={(dates) => setForm({ ...form, sitting_dates: dates })}
              />
              <button type="button" onClick={handleSaveDates} className="btn btn-primary" disabled={submitting || missingContactInfo} style={{ width: "100%", marginTop: "1.5rem" }}>
                {submitting ? "Saving…" : "Save dates"}
              </button>
            </div>
          )}

          {section === "payment" && (
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.35rem" }}>Payment method</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>
                Add a card so you can accept a sitter's bid — you're charged when you accept, and only then.
              </p>
              {hasPaymentMethod && (
                <div className="flash flash-notice" style={{ textAlign: "left", borderRadius: "0.5rem", marginBottom: "1.1rem" }}>
                  A card is on file. Save a new one below to replace it.
                </div>
              )}
              <StripeCardForm onSaved={() => { refreshPaymentMethod(); setNotice("Card saved.") }} />
            </div>
          )}

          {section === "sitter" && (
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Become a sitter</h2>

              {isSitter && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>
                  You're an approved sitter. Edit your listing below.
                </p>
              )}
              {applicationStatus === "pending" && (
                <div className="flash" style={{ background: "var(--amber-50)", color: "var(--amber-700)", textAlign: "left", borderRadius: "0.5rem", marginBottom: "1.1rem" }}>
                  Your application is pending review. You can still update your answers below while you wait.
                </div>
              )}
              {applicationStatus === "rejected" && (
                <div className="flash flash-alert" style={{ textAlign: "left", borderRadius: "0.5rem", marginBottom: "1.1rem" }}>
                  Your application wasn't approved. You're welcome to update your answers and resubmit.
                </div>
              )}
              {!isSitter && !application && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.1rem" }}>
                  Sitter profiles are granted by invite after a quick application review — fill this out and we'll be in touch.
                </p>
              )}

              {isSitter ? (
                <form onSubmit={handleSitterSubmit}>
                  <div className="field">
                    <label htmlFor="profile_photo">
                      Profile picture
                      <Tooltip text="A clear, friendly photo helps owners feel comfortable with who's coming onto their property." />
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {(sitterForm.profile_photo instanceof File ? URL.createObjectURL(sitterForm.profile_photo) : sitterForm.profile_photo_url) ? (
                        <img
                          src={sitterForm.profile_photo instanceof File ? URL.createObjectURL(sitterForm.profile_photo) : sitterForm.profile_photo_url}
                          alt="Your profile" style={{ width: "3.5rem", height: "3.5rem", objectFit: "cover", borderRadius: "999px", border: "1px solid var(--border)" }}
                        />
                      ) : (
                        <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "999px", background: "var(--field-bg)", border: "1px solid var(--border)" }} />
                      )}
                      <input id="profile_photo" type="file" accept="image/*" onChange={handleProfilePhotoChange} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="price_per_visit">
                      Price per visit ($)
                      <Tooltip text="What you charge for a single visit. Owners see this rate when reviewing your bid, and you can still offer a different amount on individual job requests." />
                    </label>
                    <input id="price_per_visit" type="number" name="price_per_visit" value={sitterForm.price_per_visit || ""} onChange={handleSitterChange} required />
                  </div>
                  <div className="field">
                    <label htmlFor="years_experience">Years of experience</label>
                    <input id="years_experience" type="number" name="years_experience" value={sitterForm.years_experience || ""} onChange={handleSitterChange} />
                  </div>
                  <div className="field">
                    <label htmlFor="travel_radius_miles">
                      Travel radius (miles)
                      <Tooltip text="The farthest you're willing to travel from your address to take a job. Requests outside this radius won't be shown to you." />
                    </label>
                    <select id="travel_radius_miles" name="travel_radius_miles" value={sitterForm.travel_radius_miles || 10} onChange={handleSitterChange}>
                      {TRAVEL_RADII.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="bio">Bio</label>
                    <textarea id="bio" name="bio" rows={3} value={sitterForm.bio || ""} onChange={handleSitterChange} placeholder="Tell owners about your experience with chickens." />
                  </div>
                  <div className="field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input id="own_flock" type="checkbox" name="own_flock" checked={!!sitterForm.own_flock} onChange={handleSitterChange} style={{ width: "auto" }} />
                    <label htmlFor="own_flock" style={{ marginBottom: 0 }}>
                      I own my own flock
                      <Tooltip text="Owners often prefer sitters with hands-on chicken-keeping experience — this shows up on your public profile." />
                    </label>
                  </div>
                  <div className="field" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input id="background_check_consent" type="checkbox" name="background_check_consent" checked={!!sitterForm.background_check_consent} onChange={handleSitterChange} required style={{ width: "auto" }} />
                    <label htmlFor="background_check_consent" style={{ marginBottom: 0 }}>
                      I consent to a background check
                      <Tooltip text="Run by Checkr, a third-party background check provider, as part of your original application." />
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={sitterSubmitting} style={{ width: "100%" }}>
                    {sitterSubmitting ? "Saving…" : "Save sitter profile"}
                  </button>
                </form>
              ) : null}

              {isSitter && (
                <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Bank information</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1rem" }}>
                    {form.sitter.stripe_onboarding_status === "complete"
                      ? "Payouts are active — you're all set to get paid for accepted bids."
                      : form.sitter.stripe_onboarding_status === "pending"
                      ? "You've started onboarding with Stripe but haven't finished. Complete it to get paid for accepted bids."
                      : form.sitter.stripe_onboarding_status === "restricted"
                      ? "Stripe needs more information before you can be paid — finish onboarding to resolve this."
                      : "Set up your payout account with Stripe so you can get paid when a bid is accepted."}
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={onboardingLinkLoading}
                    onClick={handleStripeOnboarding}
                    style={{ width: "100%" }}
                  >
                    {onboardingLinkLoading
                      ? "Redirecting…"
                      : form.sitter.stripe_onboarding_status === "complete"
                      ? "Update bank information"
                      : "Set up payouts"}
                  </button>
                </div>
              )}

              {!isSitter && (
                publishableKey ? (
                  <Elements stripe={getStripe(publishableKey)}>
                    <SitterApplicationForm
                      sitterForm={sitterForm}
                      application={application}
                      handleSitterChange={handleSitterChange}
                      toggleSitterList={toggleSitterList}
                      handleResumeChange={handleResumeChange}
                      buildApplicationFormData={buildApplicationFormData}
                      onSubmitted={handleApplicationSubmitted}
                      onError={setErrors}
                      clearNotice={() => setNotice(null)}
                      sitterSubmitting={sitterSubmitting}
                      setSitterSubmitting={setSitterSubmitting}
                    />
                  </Elements>
                ) : (
                  <p className="hint-sm">Loading…</p>
                )
              )}

              {isSitter && (
                <div style={{ marginTop: "2.5rem" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Availability</h2>
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {availabilities.map((a) => (
                      <li key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0" }}>
                        <span>{a.start_date} – {a.end_date}</span>
                        <button type="button" onClick={() => removeAvailability(a.id)} style={{ background: "transparent", border: 0, color: "var(--amber-700)", textDecoration: "underline", cursor: "pointer" }}>Remove</button>
                      </li>
                    ))}
                  </ul>
                  <form onSubmit={addAvailability} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", marginTop: "1rem" }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label htmlFor="start_date">Start</label>
                      <input id="start_date" type="date" value={newAvailability.start_date} onChange={(e) => setNewAvailability({ ...newAvailability, start_date: e.target.value })} required />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label htmlFor="end_date">End</label>
                      <input id="end_date" type="date" value={newAvailability.end_date} onChange={(e) => setNewAvailability({ ...newAvailability, end_date: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-outline">Add</button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
