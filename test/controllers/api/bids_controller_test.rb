require "test_helper"

class Api::BidsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @sitter_user = users(:sitter_sam_user)
    @owner = users(:prospective_taylor)
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
end
