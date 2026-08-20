class Api::StripeAccountsController < ApplicationController
  before_action :set_sitter

  def show
    render json: {
      stripe_onboarding_status: @sitter.stripe_onboarding_status,
      needs_stripe_onboarding: @sitter.needs_stripe_onboarding?
    }
  end

  def onboarding_link
    frontend_root = request.base_url
    url = StripePayments::ConnectAccountService.new.generate_onboarding_link(
      @sitter,
      refresh_url: "#{frontend_root}/account?section=sitter&stripe=refresh",
      return_url: "#{frontend_root}/account?section=sitter&stripe=complete"
    )
    render json: { url: url }
  rescue ::Stripe::StripeError => e
    render json: { errors: [ e.message ] }, status: :unprocessable_entity
  end

  private

  def set_sitter
    @sitter = current_user.sitter
    render json: { errors: [ "You must be an approved sitter" ] }, status: :forbidden unless @sitter
  end
end
