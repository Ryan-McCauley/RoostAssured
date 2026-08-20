require "net/http"

class NominatimGeocoder
  ENDPOINT = "https://nominatim.openstreetmap.org/search".freeze
  # Nominatim's usage policy requires a contact address on every request. Read from the
  # environment so a public repo doesn't ship a personal inbox.
  CONTACT = ENV.fetch("GEOCODER_CONTACT_EMAIL", "hello@roostassured.com").freeze
  USER_AGENT = "RoostAssured/1.0 (contact: #{CONTACT})".freeze
  TIMEOUT = 3

  Result = Struct.new(:latitude, :longitude)

  def self.geocode(zip_code)
    search("#{zip_code}, USA")
  end

  def self.search(query)
    return nil if query.blank?

    uri = URI(ENDPOINT)
    uri.query = URI.encode_www_form(q: query, format: "json", limit: 1)

    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = USER_AGENT

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: TIMEOUT, read_timeout: TIMEOUT) do |http|
      http.request(request)
    end
    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil if data.empty?

    Result.new(data.first["lat"].to_f, data.first["lon"].to_f)
  rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, JSON::ParserError => e
    Rails.logger.warn("NominatimGeocoder failed for #{query}: #{e.class} #{e.message}")
    nil
  end
end
