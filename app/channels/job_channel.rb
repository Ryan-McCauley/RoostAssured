class JobChannel < ApplicationCable::Channel
  def subscribed
    bid = Bid.find_by(id: params[:bid_id])
    reject and return unless bid && authorized?(bid)

    stream_for bid
  end

  private

  def authorized?(bid)
    bid.owner_id == current_user.id || bid.sitter.user_id == current_user.id
  end
end
