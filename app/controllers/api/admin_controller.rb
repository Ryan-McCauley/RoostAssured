class Api::AdminController < ApplicationController
  # `render.yaml` marks these `sync: false`, so they are blank on a Render service until an
  # operator fills them in. Checking them in the class body meant the check ran during eager
  # loading, and a missing value raised there took down the *entire* app on boot — every endpoint,
  # not just the admin dashboard, with a stack trace pointing at this file. Missing credentials
  # now disable only what they actually gate.
  ADMIN_USERNAME = ENV.fetch("ADMIN_USERNAME") { "admin" if Rails.env.local? }
  ADMIN_PASSWORD = ENV.fetch("ADMIN_PASSWORD") { "admin" if Rails.env.local? }

  include Paginated

  allow_unauthenticated_access
  before_action :authenticate_admin
  skip_after_action :track_page_view, raise: false

  private

  def authenticate_admin
    if ADMIN_USERNAME.blank? || ADMIN_PASSWORD.blank?
      Rails.logger.error("Admin dashboard is disabled: set ADMIN_USERNAME and ADMIN_PASSWORD.")
      return render json: { errors: [ "Admin dashboard is not configured." ] }, status: :service_unavailable
    end

    authenticate_or_request_with_http_basic("Admin") do |username, password|
      # `&` rather than `&&` so both comparisons always run — short-circuiting on the username
      # would leak, by response time, whether the username alone was correct.
      ActiveSupport::SecurityUtils.secure_compare(username, ADMIN_USERNAME) &
        ActiveSupport::SecurityUtils.secure_compare(password, ADMIN_PASSWORD)
    end
  end
end
