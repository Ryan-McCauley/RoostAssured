class Api::AccountsController < ApplicationController
  def show
    render json: {
      user: current_user.as_json_public,
      availabilities: current_user.sitter&.availabilities&.order(:start_date)&.as_json || []
    }
  end

  def update
    if current_user.update(user_params)
      render json: { user: current_user.as_json_public }
    else
      render_errors(current_user)
    end
  end

  private

  def user_params
    params.require(:user).permit(
      :name, :phone_number, :address, :city, :state, :zip_code,
      :flock_size_tier, :sitting_type, :feeder_count, :waterer_count,
      :feed_location, :water_location, :other_care_task, :special_requests,
      coop_features: [], care_tasks: [], sitting_dates: []
    )
  end
end
