module StripePayments
  class BidPaymentService
    class SitterNotOnboardedError < StandardError; end
    class NoPaymentMethodError < StandardError; end
    class SitterDeactivatedError < StandardError; end
    class AlreadyPaidError < StandardError; end

    def charge!(bid)
      sitter = bid.sitter
      owner = bid.owner

      # Second line of defence behind the row lock in ReceivedBidsController#accept: a bid that
      # already has a live payment intent must never be charged again. Failed intents raise before
      # a Payment row is written, so a genuine retry after a decline is still allowed through.
      raise AlreadyPaidError, "This bid has already been paid for" if bid.payments.where(status: %w[pending succeeded]).exists?

      raise SitterDeactivatedError, "This sitter's account is no longer active" if sitter.deactivated?
      raise SitterNotOnboardedError, "This sitter hasn't finished setting up payouts yet" unless sitter.stripe_onboarded?
      raise NoPaymentMethodError, "Add a payment method before accepting a bid" unless owner.has_payment_method?

      amount_cents = (bid.amount * 100).round
      fee_cents = (amount_cents * sitter.fee_percentage / 100).round
      customer = ::Stripe::Customer.retrieve(owner.stripe_customer_id)

      intent = ::Stripe::PaymentIntent.create(
        amount: amount_cents,
        currency: "usd",
        customer: owner.stripe_customer_id,
        payment_method: customer.invoice_settings.default_payment_method,
        confirm: true,
        off_session: true,
        application_fee_amount: fee_cents,
        transfer_data: { destination: sitter.stripe_account_id }
      )

      Payment.create!(
        bid: bid,
        stripe_payment_intent_id: intent.id,
        status: intent.status == "succeeded" ? "succeeded" : "pending",
        amount: bid.amount,
        application_fee_amount: fee_cents / 100.0,
        accepted_dates: bid.accepted_dates
      )

      intent
    end
  end
end
