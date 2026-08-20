require "test_helper"

class Api::CheckrWebhooksControllerTest < ActionDispatch::IntegrationTest
  setup do
    @key = "checkr_test_webhook_key"
    @original_key = ENV["CHECKR_WEBHOOK_KEY"]
    ENV["CHECKR_WEBHOOK_KEY"] = @key
    @application = sitter_applications(:pending_jordan)
  end

  teardown { ENV["CHECKR_WEBHOOK_KEY"] = @original_key }

  test "rejects a payload with an invalid signature" do
    post "/api/checkr/webhooks", params: { type: "report.completed" }.to_json,
      headers: { "Content-Type" => "application/json", "X-Checkr-Signature" => "bogus" }

    assert_response :bad_request
  end

  test "marks the application pending when the invitation is completed" do
    @application.update!(checkr_invitation_id: "inv_456")
    payload = { id: "evt_1", type: "invitation.completed", data: { object: { id: "inv_456" } } }.to_json

    post "/api/checkr/webhooks", params: payload,
      headers: { "Content-Type" => "application/json", "X-Checkr-Signature" => sign(payload) }

    assert_response :success
    assert_equal "pending", @application.reload.background_check_status
  end

  test "records the report status and id when a report completes" do
    @application.update!(checkr_candidate_id: "cand_123", background_check_status: "pending")
    payload = { id: "evt_2", type: "report.completed", data: { object: { id: "rep_789", candidate_id: "cand_123", status: "clear" } } }.to_json

    post "/api/checkr/webhooks", params: payload,
      headers: { "Content-Type" => "application/json", "X-Checkr-Signature" => sign(payload) }

    assert_response :success
    assert_equal "clear", @application.reload.background_check_status
    assert_equal "rep_789", @application.checkr_report_id
  end

  private

  def sign(payload)
    OpenSSL::HMAC.hexdigest("SHA256", @key, payload)
  end
end
