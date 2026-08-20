require "test_helper"

class Api::Admin::ReportsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @report = Report.create!(
      reporter: users(:owner_amy), reported_user: users(:sitter_sam_user),
      reason: "no_show", details: "Never showed up."
    )
    @auth = { "Authorization" => "Basic #{Base64.strict_encode64('admin:admin')}" }
  end

  test "index lists reports" do
    get "/api/admin/reports", headers: @auth, as: :json

    assert_response :success
    ids = JSON.parse(response.body)["reports"].map { |r| r["id"] }
    assert_includes ids, @report.id
  end

  test "review marks a report reviewed" do
    post "/api/admin/reports/#{@report.id}/review", headers: @auth, as: :json

    assert_response :success
    assert_equal "reviewed", @report.reload.status
  end

  test "dismiss marks a report dismissed" do
    post "/api/admin/reports/#{@report.id}/dismiss", headers: @auth, as: :json

    assert_response :success
    assert_equal "dismissed", @report.reload.status
  end

  test "requires admin auth" do
    get "/api/admin/reports", as: :json
    assert_response :unauthorized
  end
end
