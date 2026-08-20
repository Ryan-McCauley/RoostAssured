require "test_helper"

# Accepting a bid is the only owner-facing action that moves money, so the state guards around it
# are security-relevant: without them a repeated request re-runs the charge.
class Api::BidAcceptanceTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:owner_amy)
    @bid = bids(:accepted_job)
    post "/api/session", params: { email_address: @owner.email_address, password: "password123" }, as: :json
    assert_response :success
  end

  test "accepting an already-accepted bid is refused and creates no second payment" do
    assert_no_difference -> { Payment.count } do
      post "/api/bids/#{@bid.id}/accept", as: :json
    end

    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"].join, "no longer open"
    assert_equal "accepted", @bid.reload.status
  end

  test "accepting a bid gone stale from an edited request is refused" do
    @bid.update!(status: "submitted", stale: true)

    assert_no_difference -> { Payment.count } do
      post "/api/bids/#{@bid.id}/accept", as: :json
    end

    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"].join, "resubmit"
    assert_equal "submitted", @bid.reload.status
  end

  test "rejecting an already-accepted bid is refused" do
    post "/api/bids/#{@bid.id}/reject", as: :json

    assert_response :unprocessable_entity
    assert_equal "accepted", @bid.reload.status
  end

  test "an owner cannot accept a bid addressed to someone else" do
    other = User.create!(name: "Other Owner", email_address: "other@example.com", password: "password123")
    @bid.update!(owner: other, status: "submitted")

    post "/api/bids/#{@bid.id}/accept", as: :json

    assert_response :not_found
    assert_equal "submitted", @bid.reload.status
  end
end
