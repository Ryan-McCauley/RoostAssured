require "test_helper"

class Api::Admin::PaymentsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @payment = payments(:succeeded_job)
    @auth = { "Authorization" => "Basic #{Base64.strict_encode64('admin:admin')}" }
  end

  test "refunds a succeeded payment" do
    fake_refund = Struct.new(:id).new("re_test_123")
    Stripe::Refund.define_singleton_method(:create) { |*| fake_refund }

    post "/api/admin/payments/#{@payment.id}/refund", headers: @auth, as: :json

    assert_response :success
    assert_equal "refunded", @payment.reload.status
    assert_equal "refunded", JSON.parse(response.body)["payment"]["status"]
  ensure
    Stripe::Refund.singleton_class.send(:remove_method, :create)
  end

  test "rejects refunding a payment that hasn't succeeded" do
    @payment.update!(status: "pending")

    post "/api/admin/payments/#{@payment.id}/refund", headers: @auth, as: :json

    assert_response :unprocessable_entity
    assert_equal "pending", @payment.reload.status
  end

  test "requires admin auth" do
    post "/api/admin/payments/#{@payment.id}/refund", as: :json
    assert_response :unauthorized
  end
end
