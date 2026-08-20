module StripePayments
  # Accepting a bid is the only owner-facing action that moves money, so it is split deliberately
  # into two phases:
  #
  #   reserve!  runs inside the caller's transaction and row lock. It only writes local state.
  #   charge!   runs after that transaction has committed. It only talks to Stripe.
  #
  # The split exists because a Stripe charge is an irreversible external side effect: run it inside
  # a transaction and any later rollback -- a validation failure, a dropped connection, a killed
  # worker -- discards the Payment row while the card stays charged. That is bad by itself, and it
  # also disarms the already-paid guard below, which decides "already charged" by looking for that
  # very row. The owner clicks Accept again and pays twice.
  #
  # Reserving first means the guard is backed by a committed row before any money moves.
  class BidPaymentService
    class SitterNotOnboardedError < StandardError; end
    class NoPaymentMethodError < StandardError; end
    class SitterDeactivatedError < StandardError; end
    class AlreadyPaidError < StandardError; end

    # Statuses that mean "this bid has a live charge against it". `failed` is absent on purpose:
    # a declined card should leave the owner free to try another one.
    LIVE_STATUSES = %w[pending succeeded].freeze

    # Writes the Payment row that the charge will fill in, and returns it. Call inside the
    # transaction that holds the bid's row lock.
    def reserve!(bid)
      sitter = bid.sitter
      owner = bid.owner

      raise AlreadyPaidError, "This bid has already been paid for" if bid.payments.where(status: LIVE_STATUSES).exists?
      raise SitterDeactivatedError, "This sitter's account is no longer active" if sitter.deactivated?
      raise SitterNotOnboardedError, "This sitter hasn't finished setting up payouts yet" unless sitter.stripe_onboarded?
      raise NoPaymentMethodError, "Add a payment method before accepting a bid" unless owner.payment_method?

      amount_cents = (bid.amount * 100).round
      fee_cents = (amount_cents * sitter.fee_percentage / 100).round

      bid.payments.create!(
        status: "pending",
        amount: bid.amount,
        application_fee_amount: fee_cents / 100.0,
        accepted_dates: bid.accepted_dates,
        idempotency_key: SecureRandom.uuid
      )
    end

    # Sends the reserved payment to Stripe. Call only after the reserving transaction has committed,
    # so that a failure here can be recorded rather than rolled away.
    def charge!(payment)
      bid = payment.bid
      sitter = bid.sitter
      owner = bid.owner

      intent = ::Stripe::PaymentIntent.create(
        {
          amount: (payment.amount * 100).round,
          currency: "usd",
          customer: owner.stripe_customer_id,
          payment_method: owner.default_payment_method_id,
          confirm: true,
          off_session: true,
          application_fee_amount: (payment.application_fee_amount * 100).round,
          transfer_data: { destination: sitter.stripe_account_id },
          # Lets the webhook find this row even if the response below never lands -- see
          # Api::StripeWebhooksController#find_payment.
          metadata: { payment_id: payment.id, bid_id: bid.id }
        },
        # Collapses a retry of this same reserved payment into the original charge instead of
        # billing the owner a second time.
        idempotency_key: "payment-#{payment.idempotency_key}"
      )

      payment.update!(
        stripe_payment_intent_id: intent.id,
        status: intent.status == "succeeded" ? "succeeded" : "pending"
      )

      intent
    end
  end
end
