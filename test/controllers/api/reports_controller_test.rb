require "test_helper"

class Api::ReportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:owner_amy)
    @sitter_user = users(:sitter_sam_user)
    post "/api/session", params: { email_address: @owner.email_address, password: "password123" }, as: :json
    assert_response :success
  end

  test "creates a report" do
    post "/api/reports", params: { reported_user_id: @sitter_user.id, reason: "no_show", details: "Never showed up." }, as: :json

    assert_response :success
    report = Report.last
    assert_equal @owner.id, report.reporter_id
    assert_equal @sitter_user.id, report.reported_user_id
    assert_equal "pending", report.status
  end

  test "rejects an unrecognized reason" do
    post "/api/reports", params: { reported_user_id: @sitter_user.id, reason: "not_a_real_reason" }, as: :json

    assert_response :unprocessable_entity
  end

  test "a bid the reporter is not party to is not attached to the report" do
    outsider = User.create!(name: "Outsider", email_address: "outsider@example.com", password: "password123")
    # A bid between two other people entirely -- the logged-in reporter is on neither side of it.
    someone_elses_bid = Bid.create!(sitter: sitters(:sam), owner: outsider, amount: 25, status: "submitted")

    post "/api/reports", params: {
      reported_user_id: outsider.id, bid_id: someone_elses_bid.id, reason: "spam", details: "x"
    }, as: :json

    assert_response :success
    # bid_id used to come straight off the params, so a report could cite any bid in the system.
    assert_nil Report.order(:id).last.bid_id
  end
end
