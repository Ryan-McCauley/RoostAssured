class Api::ReceivedBidsController < ApplicationController
  before_action :set_bid, only: [:accept, :reject, :rate]

  def index
    bids = current_user.bids_received.where.not(status: "passed").order(created_at: :desc)
    render json: { bids: bids.map(&:as_owner_json) }
  end

  # Accepting is the one action that moves money, so the bid is row-locked and its state
  # re-checked inside the lock: without that, two concurrent (or simply repeated) requests
  # would each run charge! and bill the owner twice for the same bid.
  def accept
    rejection = nil

    @bid.with_lock do
      rejection =
        if @bid.status != "submitted"
          "This bid is no longer open — it may have already been accepted or withdrawn."
        elsif @bid.stale?
          "You've changed your request since this bid was placed. Ask the sitter to resubmit before accepting."
        end

      if rejection.nil?
        StripePayments::BidPaymentService.new.charge!(@bid)
        current_user.bids_received.where(status: "submitted").where.not(id: @bid.id).update_all(status: "rejected")
        @bid.update!(status: "accepted")
        @bid.seed_job_tasks!
      end
    end

    return render json: { errors: [ rejection ] }, status: :unprocessable_entity if rejection

    render json: { bids: current_user.bids_received.where.not(status: "passed").order(created_at: :desc).map(&:as_owner_json) }
  rescue StripePayments::BidPaymentService::SitterNotOnboardedError, StripePayments::BidPaymentService::NoPaymentMethodError,
         StripePayments::BidPaymentService::SitterDeactivatedError, StripePayments::BidPaymentService::AlreadyPaidError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  rescue ::Stripe::CardError, ::Stripe::StripeError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  def reject
    return render json: { errors: [ "You can't reject a bid you've already accepted." ] }, status: :unprocessable_entity if @bid.accepted?

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
