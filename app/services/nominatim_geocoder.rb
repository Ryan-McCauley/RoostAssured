require "net/http"

class NominatimGeocoder
  ENDPOINT = "https://nominatim.openstreetmap.org/search".freeze
  # Nominatim's usage policy requires a contact address on every request. Read from the
  # environment so a public repo doesn't ship a personal inbox.
  CONTACT = ENV.fetch("GEOCODER_CONTACT_EMAIL", "hello@roostassured.com").freeze
  USER_AGENT = "RoostAssured/1.0 (contact: #{CONTACT})".freeze
  TIMEOUT = 3
  # ZIP centroids don't move, and the app serves a small set of them, so the same handful of
  # lookups were being repeated forever. Caching also keeps us inside Nominatim's usage policy,
  # which asks for no more than one request a second and no bulk querying.
  CACHE_TTL = 30.days

  Result = Struct.new(:latitude, :longitude)

  def self.geocode(zip_code)
    search("#{zip_code}, USA")
  end

  def self.search(query)
    return nil if query.blank?

    cached = Rails.cache.fetch(cache_key(query), expires_in: CACHE_TTL) do
      result = uncached_search(query)
      # Cache the miss too, as a sentinel: a nonexistent place stays nonexistent, and without this
      # every bogus ZIP would hit the network on every request.
      result ? { latitude: result.latitude, longitude: result.longitude } : :not_found
    end

    return nil if cached == :not_found

    Result.new(cached[:latitude], cached[:longitude])
  end

  def self.cache_key(query)
    "nominatim/v1/#{Digest::SHA256.hexdigest(query.to_s.strip.downcase)}"
  end

  def self.uncached_search(query)
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
