class Rack::Attack
  self.cache.store = Rails.cache

  throttle("logins/ip", limit: 10, period: 1.minute) do |req|
    req.ip if req.path == "/api/session" && req.post?
  end

  throttle("signups/ip", limit: 5, period: 1.minute) do |req|
    req.ip if req.path == "/api/registration" && req.post?
  end

  throttle("password_resets/ip", limit: 5, period: 1.minute) do |req|
    req.ip if req.path == "/api/passwords" && req.post?
  end

  throttle("admin/ip", limit: 30, period: 1.minute) do |req|
    req.ip if req.path.start_with?("/api/admin")
  end

  throttle("stripe_webhooks/ip", limit: 60, period: 1.minute) do |req|
    req.ip if req.path == "/api/stripe/webhooks"
  end

  throttle("api/ip", limit: 300, period: 1.minute) do |req|
    req.ip if req.path.start_with?("/api")
  end

  self.throttled_responder = lambda do |request|
    [ 429, { "Content-Type" => "application/json" }, [ { errors: [ "Too many requests. Please try again shortly." ] }.to_json ] ]
  end
end
