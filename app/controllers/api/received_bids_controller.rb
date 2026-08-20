class Api::ReceivedBidsController < ApplicationController
  before_action :set_bid, only: [ :accept, :reject, :rate ]

  def index
    render json: { bids: owner_bids.map(&:as_owner_json) }
  end

  # Accepting is the one owner-facing action that moves money, so it runs in three phases rather
  # than one transaction:
  #
  #   1. Under the bid's row lock, re-check the guards and reserve a `pending` Payment row. Local
  #      writes only. Commit.
  #   2. Charge Stripe, outside any transaction.
  #   3. Promote the bid to `accepted` once the money is actually there.
  #
  # Phase 1 commits before phase 2 starts because a charge is irreversible: run it inside the
  # transaction and a rollback afterwards discards the Payment row while the card stays charged --
  # which also disarms the already-paid guard, since that guard works by looking for the row. The
  # bid stays `submitted` until phase 3, so it is never in a state the money doesn't back.
  def accept
    payment = nil
    rejection = nil

    @bid.with_lock do
      rejection =
        if @bid.status != "submitted"
          "This bid is no longer open — it may have already been accepted or withdrawn."
        elsif @bid.stale?
          "You've changed your request since this bid was placed. Ask the sitter to resubmit before accepting."
        end

      payment = StripePayments::BidPaymentService.new.reserve!(@bid) if rejection.nil?
    end

    return render json: { errors: [ rejection ] }, status: :unprocessable_entity if rejection

    StripePayments::BidPaymentService.new.charge!(payment)

    @bid.with_lock do
      other_bids.update_all(status: "rejected")
      @bid.update!(status: "accepted")
      @bid.seed_job_tasks!
    end

    render json: { bids: owner_bids.map(&:as_owner_json) }
  rescue StripePayments::BidPaymentService::SitterNotOnboardedError, StripePayments::BidPaymentService::NoPaymentMethodError,
         StripePayments::BidPaymentService::SitterDeactivatedError, StripePayments::BidPaymentService::AlreadyPaidError => e
    render json: { errors: [ e.message ] }, status: :unprocessable_entity
  rescue ::Stripe::CardError => e
    # A decline is definitive: no charge was created, so releasing the reservation lets the owner
    # try a different card.
    payment&.update!(status: "failed")
    render json: { errors: [ e.message ] }, status: :unprocessable_entity
  rescue ::Stripe::StripeError => e
    # Anything else -- a timeout, a connection reset -- is ambiguous: the charge may well have
    # landed. Leaving the reservation `pending` keeps the already-paid guard armed so a retry can't
    # bill twice, and the webhook settles the row either way (it can find it by metadata even
    # without an intent id). Deliberately not marking this `failed`.
    Rails.logger.error("Bid #{@bid.id} charge outcome unknown: #{e.class} #{e.message}")
    render json: { errors: [ "We couldn't confirm that payment. Give it a moment and refresh before trying again." ] },
           status: :bad_gateway
  end

  def reject
    return render json: { errors: [ "You can't reject a bid you've already accepted." ] }, status: :unprocessable_entity if @bid.accepted?

    @bid.update!(status: "rejected")
    render json: { bids: owner_bids.map(&:as_owner_json) }
  end

  def rate
    return render json: { errors: [ "You can only rate a sitter once the job has been marked completed." ] }, status: :unprocessable_entity unless @bid.accepted? && @bid.job_status == "completed"
    return render json: { errors: [ "You've already rated this sitter." ] }, status: :unprocessable_entity if @bid.rated?

    if @bid.update(rate_params)
      render json: { bids: owner_bids.map(&:as_owner_json) }
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

  # Every render in this controller returns the owner's whole bid list, and as_owner_json reaches
  # for the sitter, their user, the job tasks, and the ratings -- so preload them once here rather
  # than issuing a handful of queries per bid.
  def owner_bids
    current_user.bids_received
                .where.not(status: "passed")
                .includes(:job_tasks, sitter: [ :user, :bids ])
                .order(created_at: :desc)
  end

  def other_bids
    current_user.bids_received.where(status: "submitted").where.not(id: @bid.id)
  end
end
