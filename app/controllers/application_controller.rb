class ApplicationController < ActionController::Base
  include Authentication

  # Every client of this app is a fetch() expecting JSON. Without these, a missed `find` or a
  # missing required param rendered public/404.html or public/500.html into a response the
  # frontend then failed to parse, surfacing a generic "Request failed" with no usable detail.
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActionController::ParameterMissing, with: :render_parameter_missing

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

  def render_not_found
    render json: { errors: [ "Not found." ] }, status: :not_found
  end

  def render_parameter_missing(exception)
    render json: { errors: [ "Missing required parameter: #{exception.param}" ] }, status: :bad_request
  end

  def render_errors(record_or_records, status: :unprocessable_entity)
    records = Array(record_or_records)
    render json: { errors: records.flat_map { |r| r.errors.full_messages } }, status: status
  end
end
