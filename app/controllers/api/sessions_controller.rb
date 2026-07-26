class Api::SessionsController < ApplicationController
  allow_unauthenticated_access only: %i[ show create ]
  rate_limit to: 10, within: 3.minutes, only: :create,
             with: -> { render json: { errors: [ "Try again later." ] }, status: :too_many_requests }

  def show
    if authenticated?
      render json: { user: current_user.as_json_public }
    else
      render json: { user: nil }, status: :unauthorized
    end
  end

  def create
    if user = User.authenticate_by(params.permit(:email_address, :password))
      start_new_session_for user
      render json: { user: user.as_json_public }
    else
      render json: { errors: [ "Try another email address or password." ] }, status: :unauthorized
    end
  end

  def destroy
    terminate_session
    head :no_content
  end
end
