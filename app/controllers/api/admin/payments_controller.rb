class Api::Admin::PaymentsController < Api::AdminController
  def index
    payments = Payment.includes(bid: [ :sitter, :owner ]).order(created_at: :desc)
    render json: { payments: payments.map(&:as_admin_json) }
  end

  def refund
    payment = Payment.find(params[:id])
    StripePayments::RefundService.new.refund!(payment)
    render json: { payment: payment.as_admin_json }
  rescue StripePayments::RefundService::NotRefundableError, ::Stripe::StripeError => e
    render json: { errors: [ e.message ] }, status: :unprocessable_entity
  end
end
