class Api::ReceivedBidsController < ApplicationController
  before_action :set_bid, only: [:accept, :reject, :rate]

  def index
    bids = current_user.bids_received.where.not(status: "passed").order(created_at: :desc)
    render json: { bids: bids.map(&:as_owner_json) }
  end

  def accept
    StripePayments::BidPaymentService.new.charge!(@bid)

    ActiveRecord::Base.transaction do
      current_user.bids_received.where(status: "submitted").where.not(id: @bid.id).update_all(status: "rejected")
      @bid.update!(status: "accepted")
      @bid.seed_job_tasks!
    end
    render json: { bids: current_user.bids_received.where.not(status: "passed").order(created_at: :desc).map(&:as_owner_json) }
  rescue StripePayments::BidPaymentService::SitterNotOnboardedError, StripePayments::BidPaymentService::NoPaymentMethodError, StripePayments::BidPaymentService::SitterDeactivatedError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  rescue ::Stripe::CardError, ::Stripe::StripeError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  def reject
    @bid.update!(status: "rejected")
    render json: { bids: current_user.bids_received.where.not(status: "passed").order(created_at: :desc).map(&:as_owner_json) }
  end

  def rate
    return render json: { errors: [ "You can only rate a sitter once the job has been marked completed." ] }, status: :unprocessable_entity unless @bid.accepted? && @bid.job_status == "completed"

    if @bid.update(rate_params)
      render json: { bids: current_user.bids_received.where.not(status: "passed").order(created_at: :desc).map(&:as_owner_json) }
    else
      render_errors(@bid)
    end
  end

  private

  def rate_params
    params.require(:bid).permit(:rating, :review)
  end

  def set_bid
    @bid = current_user.bids_received.find(params[:id])
  end
end
