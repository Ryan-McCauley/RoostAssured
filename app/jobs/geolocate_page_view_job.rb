class GeolocatePageViewJob < ApplicationJob
  RATE_LIMIT_MAX_ATTEMPTS = 5

  def perform(page_view_id, attempt = 1)
    page_view = PageView.find_by(id: page_view_id)
    return if page_view.nil? || page_view.latitude.present?

    result = IpGeolocator.lookup(page_view.ip_address)
    return unless result

    page_view.update_columns(
      latitude: result.latitude,
      longitude: result.longitude,
      city: result.city,
      region: result.region
    )
  rescue IpGeolocator::RateLimited => e
    return if attempt >= RATE_LIMIT_MAX_ATTEMPTS

    retry_after = e.message.to_i.clamp(5, 120).seconds
    GeolocatePageViewJob.set(wait: retry_after).perform_later(page_view_id, attempt + 1)
  end
end
