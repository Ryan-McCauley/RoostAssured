require "test_helper"

class StripePayments::RefundServiceTest < ActiveSupport::TestCase
  setup { @payment = payments(:succeeded_job) }

  test "refunds a succeeded payment and marks it refunded" do
    fake_refund = Struct.new(:id).new("re_test_123")

    Stripe::Refund.define_singleton_method(:create) { |*| fake_refund }
    refund = StripePayments::RefundService.new.refund!(@payment)
    assert_equal fake_refund, refund

    assert_equal "refunded", @payment.reload.status
  ensure
    Stripe::Refund.singleton_class.send(:remove_method, :create)
  end

  test "refuses to refund a payment that hasn't succeeded" do
    @payment.update!(status: "pending")

    assert_raises StripePayments::RefundService::NotRefundableError do
      StripePayments::RefundService.new.refund!(@payment)
    end

    assert_equal "pending", @payment.reload.status
  end
end
