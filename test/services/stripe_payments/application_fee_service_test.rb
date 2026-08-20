require "test_helper"

class StripePayments::ApplicationFeeServiceTest < ActiveSupport::TestCase
  setup { @user = users(:prospective_taylor) }

  test "charges the card and records a succeeded fee" do
    Stripe::Customer.define_singleton_method(:create) { |*| Struct.new(:id).new("cus_123") }
    Stripe::PaymentIntent.define_singleton_method(:create) { |*| Struct.new(:id, :status).new("pi_123", "succeeded") }

    fee = StripePayments::ApplicationFeeService.new.charge!(@user, "pm_123")

    assert fee.succeeded?
    assert_equal "pi_123", fee.stripe_payment_intent_id
    assert_equal StripePayments::ApplicationFeeService::AMOUNT, fee.amount.to_f
  ensure
    Stripe::Customer.singleton_class.send(:remove_method, :create)
    Stripe::PaymentIntent.singleton_class.send(:remove_method, :create)
  end

  test "restricts to card payments so Stripe doesn't require a return_url for redirect-based methods" do
    Stripe::Customer.define_singleton_method(:create) { |*| Struct.new(:id).new("cus_123") }
    received_params = nil
    Stripe::PaymentIntent.define_singleton_method(:create) do |params|
      received_params = params
      Struct.new(:id, :status).new("pi_123", "succeeded")
    end

    StripePayments::ApplicationFeeService.new.charge!(@user, "pm_123")

    assert_equal [ "card" ], received_params[:payment_method_types]
  ensure
    Stripe::Customer.singleton_class.send(:remove_method, :create)
    Stripe::PaymentIntent.singleton_class.send(:remove_method, :create)
  end

  test "raises and records a failed fee when the charge doesn't succeed" do
    Stripe::Customer.define_singleton_method(:create) { |*| Struct.new(:id).new("cus_123") }
    Stripe::PaymentIntent.define_singleton_method(:create) { |*| Struct.new(:id, :status).new("pi_456", "requires_action") }

    assert_raises StripePayments::ApplicationFeeService::ChargeFailedError do
      StripePayments::ApplicationFeeService.new.charge!(@user, "pm_123")
    end

    fee = SitterApplicationFee.find_by(stripe_payment_intent_id: "pi_456")
    assert_equal "failed", fee.status
  ensure
    Stripe::Customer.singleton_class.send(:remove_method, :create)
    Stripe::PaymentIntent.singleton_class.send(:remove_method, :create)
  end
end
