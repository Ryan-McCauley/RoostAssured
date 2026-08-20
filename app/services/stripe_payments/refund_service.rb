module StripePayments
  class RefundService
    class NotRefundableError < StandardError; end

    def refund!(payment)
      raise NotRefundableError, "Only succeeded payments can be refunded" unless payment.status == "succeeded"

      refund = ::Stripe::Refund.create(
        {
          payment_intent: payment.stripe_payment_intent_id,
          reverse_transfer: true,
          refund_application_fee: true
        },
        # A double-clicked Refund button in the admin dashboard must not issue two refunds.
        idempotency_key: "refund-#{payment.idempotency_key}"
      )

      payment.update!(status: "refunded")

      refund
    end
  end
end
