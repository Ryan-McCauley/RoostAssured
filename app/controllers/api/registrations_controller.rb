class Api::RegistrationsController < ApplicationController
  allow_unauthenticated_access only: %i[ create ]
  rate_limit to: 5, within: 1.minute, only: :create,
             with: -> { render json: { errors: [ "Too many attempts — please try again in a minute." ] }, status: :too_many_requests }

  def create
    @user = User.new(user_params)

    if @user.save
      start_new_session_for @user
      render json: { user: @user.as_json_public }
    else
      render_errors(@user)
    end
  end

  private

  def user_params
    params.require(:user).permit(
      :name, :email_address, :password, :password_confirmation, :phone_number, :address,
      :city, :state, :zip_code,
      :flock_size_tier, :sitting_type, :feeder_count, :waterer_count,
      :feed_location, :water_location, :other_care_task, :special_requests,
      coop_features: [], care_tasks: []
    )
  end
end
