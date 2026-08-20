class Api::StripePaymentMethodsController < ApplicationController
  def show
    render json: { has_payment_method: current_user.payment_method?, publishable_key: StripeConfig.publishable_key }
  end

  def create
    StripePayments::CustomerService.new.attach_payment_method!(current_user, params.require(:payment_method_id))
    render json: { has_payment_method: current_user.payment_method? }
  rescue ::Stripe::StripeError => e
    render json: { errors: [ e.message ] }, status: :unprocessable_entity
  end
end
