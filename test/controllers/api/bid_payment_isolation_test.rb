require "test_helper"

# The charge is deliberately outside the transaction that reserves the payment. These tests pin
# that arrangement, because the failure it prevents -- a rolled-back Payment row next to a card
# that really was charged -- is silent, and re-introducing it would not break anything else.
class Api::BidPaymentIsolationTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:owner_amy)
    @sitter = sitters(:sam)
    @bid = bids(:accepted_job)
    @bid.update!(status: "submitted", stale: false)
    # The fixtures attach a succeeded payment to this bid; these tests start from an unpaid one.
    @bid.payments.destroy_all

    @sitter.update!(stripe_account_id: "acct_test_1", stripe_onboarding_status: "complete")
    @owner.update!(stripe_customer_id: "cus_test_1", stripe_default_payment_method_id: "pm_test_1")

    post "/api/session", params: { email_address: @owner.email_address, password: "password123" }, as: :json
    assert_response :success
  end

  def stub_payment_intent(status: "succeeded", &raiser)
    stub_stripe(Stripe::PaymentIntent, :create) do |params, opts = {}|
      raiser&.call(params, opts)
      Stripe::PaymentIntent.construct_from(id: "pi_stub_#{SecureRandom.hex(4)}", status: status)
    end
  end

  test "the payment row survives when the work after the charge blows up" do
    stub_payment_intent

    # Anything raising after the charge -- a validation, a dropped connection -- used to roll the
    # transaction back and take the Payment row with it, leaving the card charged and the
    # already-paid guard blind.
    exploding = ->(*) { raise ActiveRecord::RecordInvalid, self }

    with_instance_method(Bid, :seed_job_tasks!, exploding) do
      assert_difference -> { Payment.count }, 1 do
        post "/api/bids/#{@bid.id}/accept", as: :json
      rescue ActiveRecord::RecordInvalid
        # The controller doesn't rescue this; the point is what survives in the database.
      end
    end

    assert_equal "succeeded", Payment.order(:id).last.status
  end

  test "a second accept cannot charge again while a payment is live" do
    stub_payment_intent
    post "/api/bids/#{@bid.id}/accept", as: :json
    assert_response :success
    assert_equal "accepted", @bid.reload.status

    assert_no_difference -> { Payment.count } do
      post "/api/bids/#{@bid.id}/accept", as: :json
    end
    assert_response :unprocessable_entity
  end

  test "the charge carries an idempotency key and the payment id in metadata" do
    seen = {}
    stub_payment_intent { |params, opts| seen[:params] = params; seen[:opts] = opts }

    post "/api/bids/#{@bid.id}/accept", as: :json
    assert_response :success

    payment = Payment.order(:id).last
    assert_equal "payment-#{payment.idempotency_key}", seen[:opts][:idempotency_key]
    assert_equal payment.id, seen[:params][:metadata][:payment_id]
  end

  test "a declined card releases the reservation so another card can be tried" do
    stub_payment_intent { raise Stripe::CardError.new("Your card was declined.", nil) }

    post "/api/bids/#{@bid.id}/accept", as: :json

    assert_response :unprocessable_entity
    assert_equal "failed", Payment.order(:id).last.status
    assert_equal "submitted", @bid.reload.status, "a declined bid should stay open"
  end

  test "an ambiguous Stripe failure keeps the guard armed rather than inviting a second charge" do
    stub_payment_intent { raise Stripe::APIConnectionError.new("timed out") }

    post "/api/bids/#{@bid.id}/accept", as: :json

    assert_response :bad_gateway
    # Left pending on purpose: the charge may have landed, so the guard must stay up and let the
    # webhook settle it.
    assert_equal "pending", Payment.order(:id).last.status

    assert_no_difference -> { Payment.count } do
      post "/api/bids/#{@bid.id}/accept", as: :json
    end
    assert_response :unprocessable_entity
  end
end
