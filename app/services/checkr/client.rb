module Checkr
  class Client
    class Error < StandardError; end

    def initialize
      @connection = Faraday.new(url: CheckrConfig::API_BASE_URL) do |f|
        f.request :authorization, :basic, CheckrConfig.api_key, ""
        f.request :json
        f.response :json, content_type: /\bjson$/
        f.adapter Faraday.default_adapter
      end
    end

    def post(path, body)
      response = @connection.post(path, body)
      raise Error, "Checkr API error (#{response.status}): #{response.body}" unless response.success?

      response.body
    end
  end
end
