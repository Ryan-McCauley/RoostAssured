class Api::Admin::PaymentsController < Api::AdminController
  def index
    payments = filtered(Payment.includes(bid: [ { sitter: :user }, :owner ]).order(created_at: :desc))

    render json: {
      payments: paginate(payments).map(&:as_admin_json),
      meta: pagination_meta(payments),
      stats: stats
    }
  end

  def refund
    payment = Payment.find(params[:id])
    StripePayments::RefundService.new.refund!(payment)
    render json: { payment: payment.as_admin_json }
  rescue StripePayments::RefundService::NotRefundableError, ::Stripe::StripeError => e
    render json: { errors: [ e.message ] }, status: :unprocessable_entity
  end

  private

  # Filtering moved here from the dashboard for the same reason the totals did: applied in
  # JavaScript it would only ever search the page currently on screen.
  def filtered(scope)
    scope = scope.where(status: params[:status]) if Payment::STATUSES.include?(params[:status])

    if params[:q].present?
      pattern = "%#{ActiveRecord::Base.sanitize_sql_like(params[:q].strip)}%"
      scope = scope.joins(bid: :owner)
                   .joins("INNER JOIN sitters ON sitters.id = bids.sitter_id")
                   .joins("INNER JOIN users sitter_users ON sitter_users.id = sitters.user_id")
                   .where("users.name ILIKE :q OR sitter_users.name ILIKE :q", q: pattern)
    end

    scope
  end

  # Aggregated in SQL across every payment. The dashboard used to derive these in JavaScript from
  # the full list it was sent, which only worked while that list was unbounded.
  def stats
    counts = Payment.group(:status).count
    {
      volume: Payment.where(status: "succeeded").sum(:amount).to_f,
      succeeded_count: counts.fetch("succeeded", 0),
      pending_count: counts.fetch("pending", 0),
      failed_count: counts.fetch("failed", 0) + counts.fetch("refunded", 0),
      total: counts.values.sum
    }
  end
end
