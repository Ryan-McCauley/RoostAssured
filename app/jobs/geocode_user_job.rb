# Geocoding is an outbound HTTP call to Nominatim with a multi-second timeout. Running it from an
# after_save callback put that latency inside every profile save, on a web service configured for
# one worker and five threads.
class GeocodeUserJob < ApplicationJob
  def perform(user_id)
    user = User.find_by(id: user_id)
    return if user.nil? || user.zip_code.blank?

    result = NominatimGeocoder.geocode(user.zip_code)
    return unless result

    user.update_columns(latitude: result.latitude, longitude: result.longitude)
  end
end
