require "net/http"

class IpGeolocator
  ENDPOINT = "http://ip-api.com/json/%s".freeze
  USER_AGENT = "RoostAssured/1.0 (contact: rmccauleycode@gmail.com)".freeze
  TIMEOUT = 3

  Result = Struct.new(:latitude, :longitude, :city, :region)
  RateLimited = Class.new(StandardError)

  def self.lookup(ip)
    return nil if ip.blank?

    uri = URI(format(ENDPOINT, ip))
    uri.query = URI.encode_www_form(fields: "status,message,lat,lon,city,regionName")

    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = USER_AGENT

    response = Net::HTTP.start(uri.host, uri.port, open_timeout: TIMEOUT, read_timeout: TIMEOUT) do |http|
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
