require "test_helper"

class Api::StripeWebhooksControllerTest < ActionDispatch::IntegrationTest
  setup do
    @secret = "whsec_test_secret"
    @original_secret = ENV["STRIPE_WEBHOOK_SECRET"]
    ENV["STRIPE_WEBHOOK_SECRET"] = @secret
  end

  teardown { ENV["STRIPE_WEBHOOK_SECRET"] = @original_secret }

  test "rejects a payload with an invalid signature" do
    post "/api/stripe/webhooks", params: { type: "payment_intent.succeeded" }.to_json,
      headers: { "Content-Type" => "application/json", "Stripe-Signature" => "t=1,v1=bogus" }

    assert_response :bad_request
  end

  test "accepts a payload with a valid signature" do
    payload = { id: "evt_123", type: "account.updated", data: { object: { id: "acct_123" } } }.to_json
    timestamp = Time.now
    signature = Stripe::Webhook::Signature.compute_signature(timestamp, payload, @secret)
    header = Stripe::Webhook::Signature.generate_header(timestamp, signature)

    post "/api/stripe/webhooks", params: payload,
      headers: { "Content-Type" => "application/json", "Stripe-Signature" => header }

    assert_response :success
  end
end
