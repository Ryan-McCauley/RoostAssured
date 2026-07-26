class Api::PasswordsController < ApplicationController
  allow_unauthenticated_access
  rate_limit to: 10, within: 3.minutes, only: :create,
             with: -> { render json: { errors: [ "Try again later." ] }, status: :too_many_requests }

  def create
    if user = User.find_by(email_address: params[:email_address])
      PasswordsMailer.reset(user).deliver_later
    end

    render json: { message: "Password reset instructions sent (if user with that email address exists)." }
  end
end
