require "test_helper"

class Api::SitterApplicationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:prospective_taylor)
    post "/api/session", params: { email_address: @user.email_address, password: "password123" }, as: :json
    assert_response :success

    @original_checkr_key = ENV["CHECKR_API_KEY"]
    ENV["CHECKR_API_KEY"] = "test_key"
  end

  teardown { ENV["CHECKR_API_KEY"] = @original_checkr_key }

  test "charges the application fee, creates the application, and sends a Checkr invitation" do
    Stripe::Customer.define_singleton_method(:create) { |*| Struct.new(:id).new("cus_123") }
    Stripe::PaymentIntent.define_singleton_method(:create) { |*| Struct.new(:id, :status).new("pi_123", "succeeded") }
    checkr_responses = { "candidates" => { "id" => "cand_123" }, "invitations" => { "id" => "inv_456" } }
    Checkr::Client.define_method(:post) { |path, _body| checkr_responses.fetch(path) }

    post "/api/sitter_application", params: application_params.merge(payment_method_id: "pm_123"), as: :json

    assert_response :success
    application = @user.reload.sitter_application
    assert_not_nil application
    assert_equal "invited", application.background_check_status
    assert_equal "inv_456", application.checkr_invitation_id

    fee = SitterApplicationFee.find_by(stripe_payment_intent_id: "pi_123")
    assert_equal "succeeded", fee.status
    assert_equal application.id, fee.sitter_application_id
  ensure
    Stripe::Customer.singleton_class.send(:remove_method, :create)
    Stripe::PaymentIntent.singleton_class.send(:remove_method, :create)
    Checkr::Client.remove_method(:post)
  end

  test "rejects the application (and never creates it) if the card is declined" do
    Stripe::Customer.define_singleton_method(:create) { |*| Struct.new(:id).new("cus_123") }
    Stripe::PaymentIntent.define_singleton_method(:create) { |*| Struct.new(:id, :status).new("pi_789", "requires_action") }

    post "/api/sitter_application", params: application_params.merge(payment_method_id: "pm_123"), as: :json

    assert_response :unprocessable_entity
    assert_nil @user.reload.sitter_application
  ensure
    Stripe::Customer.singleton_class.send(:remove_method, :create)
    Stripe::PaymentIntent.singleton_class.send(:remove_method, :create)
  end

  test "reuses an already-succeeded orphaned fee instead of charging twice" do
    fee = SitterApplicationFee.create!(user: @user, stripe_payment_intent_id: "pi_prior", amount: 50.00, status: "succeeded")
    Stripe::PaymentIntent.define_singleton_method(:create) { |*| raise "should not be called" }
    checkr_responses = { "candidates" => { "id" => "cand_123" }, "invitations" => { "id" => "inv_456" } }
    Checkr::Client.define_method(:post) { |path, _body| checkr_responses.fetch(path) }

    post "/api/sitter_application", params: application_params.merge(payment_method_id: "pm_123"), as: :json

    assert_response :success
    assert_equal @user.reload.sitter_application.id, fee.reload.sitter_application_id
  ensure
    Stripe::PaymentIntent.singleton_class.send(:remove_method, :create)
    Checkr::Client.remove_method(:post)
  end

  private

  def application_params
    {
      sitter_application: {
        first_name: "Taylor", last_name: "Prospect", street_address: "1 Coop Ln",
        city: "Austin", state: "TX", zip_code: "78701", price_per_visit: 20.00,
        background_check_consent: true
      }
    }
  end
end
