class Api::SitterApplicationsController < ApplicationController
  def create
    return render json: { errors: [ "You already have an approved sitter profile." ] }, status: :unprocessable_entity if current_user.sitter
    return render json: { errors: [ "You already have an application on file." ] }, status: :unprocessable_entity if current_user.sitter_application

    # A prior attempt may have already paid but failed to save the application (e.g. a validation
    # error) — reuse that charge instead of billing the non-refundable fee twice.
    fee = current_user.sitter_application_fees.succeeded.where(sitter_application_id: nil).last

    unless fee
      begin
        fee = StripePayments::ApplicationFeeService.new.charge!(current_user, params.require(:payment_method_id))
      rescue StripePayments::ApplicationFeeService::ChargeFailedError, ::Stripe::CardError, ::Stripe::StripeError => e
        return render json: { errors: [ e.message ] }, status: :unprocessable_entity
      end
    end

    application = current_user.build_sitter_application(application_params)

    if application.save
      fee.update!(sitter_application: application)

      begin
        Checkr::InvitationService.new.create_invitation!(application)
      rescue Checkr::Client::Error => e
        Rails.logger.error("Checkr invitation creation failed for sitter application #{application.id}: #{e.message}")
      end

      render json: { user: current_user.as_json_public }
    else
      render_errors(application)
    end
  end

  def update
    application = current_user.sitter_application
    return render json: { errors: [ "No application found." ] }, status: :not_found unless application
    return render json: { errors: [ "This application has already been approved." ] }, status: :forbidden if application.approved?

    # Editing a pending or rejected application resubmits it for review.
    if application.update(application_params.merge(status: "pending", reviewed_at: nil))
      render json: { user: current_user.as_json_public }
    else
      render_errors(application)
    end
  end

  private

  def application_params
    params.require(:sitter_application).permit(
      :first_name, :middle_name, :last_name, :street_address, :city, :state, :zip_code,
      :bio, :price_per_visit, :years_experience, :own_flock, :travel_radius_miles,
      :background_check_consent, :resume,
      availability_days: [], availability_times: []
    )
  end
end
