require "test_helper"

class Api::BidsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @sitter_user = users(:sitter_sam_user)
    @sitter = sitters(:sam)
    @owner = users(:prospective_taylor)

    # A sitter may only bid on an owner who has an open request inside their travel radius, so the
    # happy path has to establish both. Co-locating them keeps the distance at zero.
    @sitter_user.update_columns(latitude: 32.5, longitude: -94.7)
    @owner.update_columns(latitude: 32.5, longitude: -94.7)
    @owner.update_columns(sitting_dates: [ Date.current + 3 ])

    post "/api/session", params: { email_address: @sitter_user.email_address, password: "password123" }, as: :json
    assert_response :success
  end

  test "allows a sitter to bid on an owner they haven't blocked" do
    post "/api/job_requests/#{@owner.id}/bid", params: { bid: { amount: 30, accepted_dates: [], declined_dates: [] } }, as: :json

    assert_response :success
  end

  test "forbids bidding once either party has blocked the other" do
    Block.create!(blocker: @owner, blocked_user: @sitter_user)

    post "/api/job_requests/#{@owner.id}/bid", params: { bid: { amount: 30, accepted_dates: [], declined_dates: [] } }, as: :json

    assert_response :forbidden
  end

  test "forbids bidding on an owner outside the sitter's travel radius" do
    # Far enough that no travel_radius_miles in TRAVEL_RADII reaches it.
    @owner.update_columns(latitude: 40.7, longitude: -74.0)

    post "/api/job_requests/#{@owner.id}/bid", params: { bid: { amount: 30, accepted_dates: [], declined_dates: [] } }, as: :json

    assert_response :forbidden
  end

  test "forbids bidding on a user who has no open request" do
    @owner.update_columns(sitting_dates: [])

    post "/api/job_requests/#{@owner.id}/bid", params: { bid: { amount: 30, accepted_dates: [], declined_dates: [] } }, as: :json

    assert_response :forbidden
  end
end
