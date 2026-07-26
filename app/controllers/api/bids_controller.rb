class Api::BidsController < ApplicationController
  RATE_LIMIT_RESPONSE = -> { render json: { errors: [ "You're doing that too much — please slow down and try again in a bit." ] }, status: :too_many_requests }

  rate_limit to: 20, within: 1.minute, only: [ :create, :update, :pass ],
             by: -> { current_user.id }, with: RATE_LIMIT_RESPONSE

  before_action :require_sitter
  before_action :set_owner

  def create
    return render json: { errors: [ "You've already responded to this request." ] }, status: :unprocessable_entity if existing_bid

    bid = @sitter.bids.build(bid_params.merge(owner: @owner, status: "submitted"))
    save_and_render(bid)
  end

  def update
    return render json: { errors: [ "No bid found." ] }, status: :not_found unless existing_bid

    existing_bid.assign_attributes(bid_params.merge(status: "submitted", stale: false))
    save_and_render(existing_bid)
  end

  def pass
    bid = existing_bid || @sitter.bids.build(owner: @owner)
    bid.assign_attributes(status: "passed", accepted_dates: [], declined_dates: [])
    save_and_render(bid)
  end

  private

  def require_sitter
    @sitter = current_user.sitter
    return render json: { errors: [ "You need an approved sitter profile to respond to job requests." ] }, status: :forbidden unless @sitter
    render json: { errors: [ "Your sitter account has been deactivated." ] }, status: :forbidden if @sitter.deactivated?
  end

  def set_owner
    @owner = User.find(params[:owner_id])
  end

  def existing_bid
    @existing_bid ||= @sitter.bids.find_by(owner: @owner)
  end

  def save_and_render(bid)
    if bid.save
      render json: { bid: bid.as_json_public }
    else
      render_errors(bid)
    end
  end

  def bid_params
    params.require(:bid).permit(:amount, :message, accepted_dates: [], declined_dates: [])
  end
end
