class Api::SittingRequestsController < ApplicationController
  def destroy
    return render json: { errors: [ "You don't have an open request to cancel." ] }, status: :unprocessable_entity if current_user.sitting_dates.blank?
    return render json: { errors: [ "You've already accepted a sitter's bid — this request can't be cancelled." ] }, status: :forbidden if current_user.bids_received.where(status: "accepted").exists?

    ActiveRecord::Base.transaction do
      current_user.bids_received.destroy_all
      current_user.update!(sitting_dates: [])
    end

    render json: { user: current_user.as_json_public }
  end
end
