class Api::Admin::PaymentsController < Api::AdminController
  def index
    payments = Payment.includes(bid: [:sitter, :owner]).order(created_at: :desc)
    render json: { payments: payments.map(&:as_admin_json) }
  end
end
