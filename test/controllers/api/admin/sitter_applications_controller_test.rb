require "test_helper"

class Api::Admin::SitterApplicationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @application = sitter_applications(:pending_jordan)
    @auth = { "Authorization" => "Basic #{Base64.strict_encode64('admin:admin')}" }
  end

  test "approving an application creates a Stripe Connect account for the new sitter" do
    Stripe::Account.define_singleton_method(:create) { |*| Struct.new(:id).new("acct_123") }

    post "/api/admin/sitter_applications/#{@application.id}/approve", headers: @auth, as: :json

    assert_response :success
    sitter = @application.reload.user.sitter
    assert_equal "acct_123", sitter.stripe_account_id
    assert_equal "approved", @application.status
  ensure
    Stripe::Account.singleton_class.send(:remove_method, :create)
  end

  test "approval still succeeds even if Stripe Connect account creation fails" do
    Stripe::Account.define_singleton_method(:create) { |*| raise Stripe::StripeError, "boom" }

    post "/api/admin/sitter_applications/#{@application.id}/approve", headers: @auth, as: :json

    assert_response :success
    assert_equal "approved", @application.reload.status
  ensure
    Stripe::Account.singleton_class.send(:remove_method, :create)
  end
end
