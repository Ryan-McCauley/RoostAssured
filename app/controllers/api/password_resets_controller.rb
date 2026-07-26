class Api::PasswordResetsController < ApplicationController
  allow_unauthenticated_access
  before_action :set_user_by_token

  def show
    render json: { valid: @user.present? }
  end

  def update
    if @user.nil?
      render json: { errors: [ "Password reset link is invalid or has expired." ] }, status: :unprocessable_entity
      return
    end

    if @user.update(params.permit(:password, :password_confirmation))
      @user.sessions.destroy_all
      render json: { message: "Password has been reset." }
    else
      render_errors(@user)
    end
  end

  private

  def set_user_by_token
    @user = User.find_by_password_reset_token!(params[:token])
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    @user = nil
  end
end
