class Api::Admin::SitterApplicationsController < Api::AdminController
  def index
    applications = SitterApplication.includes(:user).order(Arel.sql("status = 'pending' DESC"), created_at: :desc)
    render json: { sitter_applications: applications.map(&:as_json_public) }
  end

  def approve
    application = SitterApplication.find(params[:id])

    ActiveRecord::Base.transaction do
      sitter = application.user.sitter || application.user.build_sitter
      sitter.assign_attributes(
        bio: application.bio, price_per_visit: application.price_per_visit,
        years_experience: application.years_experience, own_flock: application.own_flock,
        travel_radius_miles: application.travel_radius_miles,
        background_check_consent: application.background_check_consent
      )
      sitter.save!
      application.update!(status: "approved", reviewed_at: Time.current)
    end

    begin
      StripePayments::ConnectAccountService.new.create_account!(application.user.sitter)
    rescue ::Stripe::StripeError => e
      Rails.logger.error("Stripe Connect account creation failed for sitter #{application.user.sitter.id}: #{e.message}")
    end

    render json: { sitter_application: application.as_json_public }
  rescue ActiveRecord::RecordInvalid => e
    render_errors(e.record)
  end

  def reject
    application = SitterApplication.find(params[:id])
    application.update!(status: "rejected", reviewed_at: Time.current)
    render json: { sitter_application: application.as_json_public }
  end
end
