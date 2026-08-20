require "net/http"

class IpGeolocator
  # HTTPS, not the plaintext endpoint this used to call: these requests carry a visitor's IP
  # address to a third party, and in the clear that is readable by anything on the path.
  ENDPOINT = "https://pro.ip-api.com/json/%s".freeze
  # Free-tier ip-api has no HTTPS endpoint, so geolocation is simply off unless a key is present.
  # Analytics enrichment is not worth sending visitor IPs unencrypted.
  API_KEY = ENV["IP_API_KEY"].freeze
  CONTACT = ENV.fetch("GEOCODER_CONTACT_EMAIL", "hello@roostassured.com").freeze
  USER_AGENT = "RoostAssured/1.0 (contact: #{CONTACT})".freeze
  TIMEOUT = 3

  Result = Struct.new(:latitude, :longitude, :city, :region)
  RateLimited = Class.new(StandardError)

  def self.configured?
    API_KEY.present?
  end

  def self.lookup(ip)
    return nil if ip.blank? || !configured?

    uri = URI(format(ENDPOINT, ip))
    uri.query = URI.encode_www_form(fields: "status,message,lat,lon,city,regionName", key: API_KEY)

    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = USER_AGENT

    response = Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: TIMEOUT, read_timeout: TIMEOUT) do |http|
      http.request(request)
    end

    if response.code == "429"
      raise RateLimited, (response["X-Ttl"] || 60)
    end

    return nil unless response.is_a?(Net::HTTPSuccess)

    data = JSON.parse(response.body)
    return nil unless data["status"] == "ok"

    Result.new(data["lat"], data["lon"], data["city"], data["regionName"])
  rescue Net::OpenTimeout, Net::ReadTimeout, SocketError, JSON::ParserError => e
    Rails.logger.warn("IpGeolocator failed for #{ip}: #{e.class} #{e.message}")
    nil
  end
end
