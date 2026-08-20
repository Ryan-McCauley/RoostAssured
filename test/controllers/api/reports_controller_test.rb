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
end
