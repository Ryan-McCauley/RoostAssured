module StripePayments
  class ApplicationFeeService
    class ChargeFailedError < StandardError; end

    # Covers the cost of the Checkr report plus processing. Keep in sync with the frontend's
    # BACKGROUND_CHECK_FEE constant in app/frontend/pages/Account.jsx.
    AMOUNT = 50.00

    # Charges the sitter applicant's card for the (non-refundable) application fee and records the
    # attempt. The candidate is present in the browser for this, so the charge is confirmed
    # on-session rather than off-session like a stored-card marketplace charge.
    def charge!(user, payment_method_id)
      customer_id = CustomerService.new.create_customer!(user)

      intent = ::Stripe::PaymentIntent.create(
        amount: (AMOUNT * 100).round,
        currency: "usd",
        customer: customer_id,
        payment_method: payment_method_id,
        # Restricting to card payments (rather than leaving Stripe's dashboard-configured
        # "automatic_payment_methods" to decide) avoids redirect-based methods, which would
        # otherwise require a return_url for this on-session, server-confirmed charge.
        payment_method_types: [ "card" ],
        confirm: true,
        off_session: false,
        description: "Roost Assured sitter application fee"
      )

      fee = SitterApplicationFee.create!(
        user: user,
        stripe_payment_intent_id: intent.id,
        amount: AMOUNT,
        status: intent.status == "succeeded" ? "succeeded" : "failed"
      )

      raise ChargeFailedError, "Payment could not be completed — try a different card." unless fee.succeeded?

      fee
    end
  end
end
