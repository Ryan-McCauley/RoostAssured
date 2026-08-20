require "test_helper"

class Api::Admin::SitterApplicationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @application = sitter_applications(:pending_jordan)
    # Approval requires a cleared background check, so the happy-path tests start from one.
    @application.update!(background_check_status: "clear")
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

  # Approval creates a live sitter who gets sent to strangers' homes. These are the guards that
  # make the $50 fee and the Checkr integration mean something.
  test "refuses to approve an applicant whose background check is still pending" do
    @application.update!(background_check_status: "pending")

    post "/api/admin/sitter_applications/#{@application.id}/approve", headers: @auth, as: :json

    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["errors"].join, "hasn't come back yet"
    assert_equal "pending", @application.reload.status
    assert_nil @application.user.sitter
  end

  test "refuses to approve an applicant whose background check came back flagged" do
    @application.update!(background_check_status: "consider")

    post "/api/admin/sitter_applications/#{@application.id}/approve", headers: @auth, as: :json

    assert_response :unprocessable_entity
    assert_nil @application.reload.user.sitter
  end

  test "an explicit override approves a flagged applicant and records that it happened" do
    Stripe::Account.define_singleton_method(:create) { |*| Struct.new(:id).new("acct_123") }
    @application.update!(background_check_status: "consider")

    post "/api/admin/sitter_applications/#{@application.id}/approve",
      params: { override_background_check: true }, headers: @auth, as: :json

    assert_response :success
    assert_equal "approved", @application.reload.status
    assert @application.approved_despite_background_check, "the override should leave a trace"
  ensure
    Stripe::Account.singleton_class.send(:remove_method, :create)
  end

  test "a clear check is approved without an override and is not marked as one" do
    Stripe::Account.define_singleton_method(:create) { |*| Struct.new(:id).new("acct_123") }

    post "/api/admin/sitter_applications/#{@application.id}/approve", headers: @auth, as: :json

    assert_response :success
    assert_not @application.reload.approved_despite_background_check
  ensure
    Stripe::Account.singleton_class.send(:remove_method, :create)
  end
end
