class Api::StripeWebhooksController < ApplicationController
  allow_unauthenticated_access
  skip_before_action :verify_authenticity_token, raise: false

  def create
    event = verify_event
    return head :bad_request unless event

    return head :ok unless StripeEvent.create_if_new(event.id)

    case event.type
    when "account.updated"
      handle_account_updated(event.data.object)
    when "customer.updated"
      handle_customer_updated(event.data.object)
    when "payment_intent.succeeded"
      handle_payment_intent(event.data.object, status: "succeeded")
    when "payment_intent.payment_failed"
      handle_payment_intent(event.data.object, status: "failed")
    when "charge.refunded"
      handle_charge_refunded(event.data.object)
    end

    head :ok
  end

  private

  def verify_event
    # raw_post rather than request.body.read: params parsing has already consumed the body, and
    # raw_post is the accessor that reliably hands back the original bytes the signature covers.
    ::Stripe::Webhook.construct_event(request.raw_post, request.headers["Stripe-Signature"], StripeConfig.webhook_secret)
  rescue JSON::ParserError, ::Stripe::SignatureVerificationError => e
    Rails.logger.error("Stripe webhook signature verification failed: #{e.message}")
    nil
  end

  def handle_account_updated(account)
    sitter = Sitter.find_by(stripe_account_id: account.id)
    return unless sitter

    StripePayments::ConnectAccountService.new.sync_status!(sitter, account)
  end

  def handle_customer_updated(customer)
    user = User.find_by(stripe_customer_id: customer.id)
    return unless user

    StripePayments::CustomerService.new.sync_default_payment_method!(user, customer)
  end

  def handle_payment_intent(intent, status:)
    payment = find_payment(intent)
    return unless payment

    # The intent id may not be on the row yet if this event beat the charge response back.
    payment.update!(status: status, stripe_payment_intent_id: intent.id)

    # An off-session charge can be declined asynchronously, after the bid was already promoted.
    # Put it back on the board so the owner can pick another sitter or another card.
    payment.bid.update!(status: "submitted") if status == "failed" && payment.bid.accepted?
  end

  def handle_charge_refunded(charge)
    payment = Payment.find_by(stripe_payment_intent_id: charge.payment_intent)
    return unless payment

    payment.update!(status: "refunded")
  end

  # Stripe often delivers payment_intent.succeeded before the API response that carries the intent
  # id has even been written down, so looking the row up by that id alone loses the race -- and
  # because the event is recorded as processed, the retry is dropped too, stranding the payment in
  # `pending` forever. BidPaymentService stamps the payment's own id into the intent's metadata
  # precisely so this lookup has something stable to match on.
  def find_payment(intent)
    by_metadata = intent.metadata&.[]("payment_id")
    (by_metadata && Payment.find_by(id: by_metadata)) || Payment.find_by(stripe_payment_intent_id: intent.id)
  end
end
