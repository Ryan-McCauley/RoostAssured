class Api::MessagesController < ApplicationController
  rate_limit to: 20, within: 1.minute, only: [ :create ], by: -> { current_user.id },
             with: -> { render json: { errors: [ "You're sending messages too quickly — please slow down and try again in a bit." ] }, status: :too_many_requests }

  before_action :set_bid
  before_action :ensure_not_blocked, only: [ :create ]

  def index
    render json: { messages: @bid.messages.order(created_at: :asc).map { |m| m.as_json_for(current_user) } }
  end

  def create
    message = @bid.messages.build(body: params[:body], sender: current_user)
    if message.save
      render json: { messages: @bid.messages.order(created_at: :asc).map { |m| m.as_json_for(current_user) } }
    else
      render_errors(message)
    end
  end

  private

  def set_bid
    @bid = Bid.where(owner_id: current_user.id).or(Bid.where(sitter_id: current_user.sitter&.id)).find(params[:bid_id])
  end

  def ensure_not_blocked
    other_user = @bid.owner_id == current_user.id ? @bid.sitter.user : @bid.owner
    render json: { errors: [ "You can't message this user." ] }, status: :forbidden if current_user.blocked?(other_user)
  end
end
