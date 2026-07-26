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
    when "payment_intent.succeeded"
      handle_payment_intent(event.data.object, status: "succeeded")
    when "payment_intent.payment_failed"
      handle_payment_intent(event.data.object, status: "failed")
    end

    head :ok
  end

  private

  def verify_event
    payload = request.body.read
    sig_header = request.headers["Stripe-Signature"]
    ::Stripe::Webhook.construct_event(payload, sig_header, StripeConfig.webhook_secret)
  rescue JSON::ParserError, ::Stripe::SignatureVerificationError => e
    Rails.logger.error("Stripe webhook signature verification failed: #{e.message}")
    nil
  end

  def handle_account_updated(account)
    sitter = Sitter.find_by(stripe_account_id: account.id)
    return unless sitter

    StripePayments::ConnectAccountService.new.sync_status!(sitter, account)
  end

  def handle_payment_intent(intent, status:)
    payment = Payment.find_by(stripe_payment_intent_id: intent.id)
    return unless payment

    payment.update!(status: status)
    payment.bid.update!(status: "submitted") if status == "failed" && payment.bid.status == "accepted"
  end
end
