class Api::SittingRequestsController < ApplicationController
  def destroy
    return render json: { errors: [ "You don't have an open request to cancel." ] }, status: :unprocessable_entity if current_user.sitting_dates.blank?
    return render json: { errors: [ "You've already accepted a sitter's bid — this request can't be cancelled." ] }, status: :forbidden if current_user.bids_received.where(status: "accepted").exists?

    ActiveRecord::Base.transaction do
      # Withdrawn, not destroyed. `destroy_all` here cascaded into payments, messages, and job
      # tasks, so cancelling a request could erase financial records and the conversation that
      # explains them. Sitters stop seeing these because the owner's sitting_dates are cleared.
      current_user.bids_received.where(status: "submitted").update_all(status: "rejected", updated_at: Time.current)
      current_user.update!(sitting_dates: [])
    end

    render json: { user: current_user.as_json_public }
  end
end
