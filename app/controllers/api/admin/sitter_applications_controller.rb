class Api::Admin::SitterApplicationsController < Api::AdminController
  def index
    applications = SitterApplication.includes(:user).order(Arel.sql("status = 'pending' DESC"), created_at: :desc)
    render json: { sitter_applications: applications.map(&:as_json_public) }
  end

  def approve
    application = SitterApplication.find(params[:id])

    unless application.approvable?(override: override_requested?)
      return render json: { errors: [ application.approval_blocked_reason ] }, status: :unprocessable_entity
    end

    ActiveRecord::Base.transaction do
      sitter = application.user.sitter || application.user.build_sitter
      sitter.assign_attributes(
        bio: application.bio, price_per_visit: application.price_per_visit,
        years_experience: application.years_experience, own_flock: application.own_flock,
        travel_radius_miles: application.travel_radius_miles,
        background_check_consent: application.background_check_consent
      )
      sitter.save!
      application.update!(
        status: "approved",
        reviewed_at: Time.current,
        approved_despite_background_check: override_requested? && !application.background_check_cleared?
      )
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

  # An override is a deliberate, recorded act rather than the default. The flag is persisted on the
  # application so "who approved a sitter whose check wasn't clear, and when" is answerable later.
  def override_requested?
    ActiveModel::Type::Boolean.new.cast(params[:override_background_check]).present?
  end

  def reject
    application = SitterApplication.find(params[:id])
    application.update!(status: "rejected", reviewed_at: Time.current)
    render json: { sitter_application: application.as_json_public }
  end
end
