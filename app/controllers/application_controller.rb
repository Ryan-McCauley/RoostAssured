class ApplicationController < ActionController::Base
  include Authentication

  after_action :track_page_view, if: -> { request.get? && !request.path.start_with?("/api") }

  helper_method :current_user

  private

  def current_user
    Current.user
  end

  def track_page_view
    page_view = PageView.create!(ip_address: request.remote_ip, path: request.path, user: current_user)
    GeolocatePageViewJob.perform_later(page_view.id)
  rescue StandardError => e
    Rails.logger.error("track_page_view failed: #{e.message}")
  end

  def render_errors(record_or_records, status: :unprocessable_entity)
    records = Array(record_or_records)
    render json: { errors: records.flat_map { |r| r.errors.full_messages } }, status: status
  end
end
