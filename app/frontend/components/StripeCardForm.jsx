import React, { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { api } from "../lib/api"

let stripePromise = null
function getStripe(publishableKey) {
  if (!stripePromise && publishableKey) stripePromise = loadStripe(publishableKey)
  return stripePromise
}

function CardForm({ onSaved }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      })
      if (stripeError) {
        setError(stripeError.message)
        return
      }
      await api.post("/stripe_payment_method", { payment_method_id: paymentMethod.id })
      onSaved()
    } catch (err) {
      setError(err.data?.errors?.join(", ") || "Couldn't save your card.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="flash flash-alert">{error}</p>}
      <div className="field">
        <label>Card details</label>
        <div style={{ padding: "0.65rem 0.75rem", border: "1px solid var(--border)", borderRadius: "0.5rem" }}>
          <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={!stripe || submitting} style={{ width: "100%" }}>
        {submitting ? "Saving…" : "Save card"}
      </button>
    </form>
  )
}

export default function StripeCardForm({ onSaved }) {
  const [publishableKey, setPublishableKey] = useState(null)

  useEffect(() => {
    api.get("/stripe_payment_method").then((r) => setPublishableKey(r.publishable_key))
  }, [])

  if (!publishableKey) return null

  return (
    <Elements stripe={getStripe(publishableKey)}>
      <CardForm onSaved={onSaved} />
    </Elements>
  )
}
