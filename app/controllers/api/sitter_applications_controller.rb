class Api::SitterApplicationsController < ApplicationController
  def create
    return render json: { errors: [ "You already have an approved sitter profile." ] }, status: :unprocessable_entity if current_user.sitter
    return render json: { errors: [ "You already have an application on file." ] }, status: :unprocessable_entity if current_user.sitter_application

    application = current_user.build_sitter_application(application_params)

    if application.save
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
