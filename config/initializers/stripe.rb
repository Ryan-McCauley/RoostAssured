stripe_credentials = Rails.application.credentials.stripe || {}

Stripe.api_key = ENV.fetch("STRIPE_SECRET_KEY", stripe_credentials[:secret_key])
Stripe.api_version = "2024-06-20"

module StripeConfig
  def self.publishable_key
    ENV.fetch("STRIPE_PUBLISHABLE_KEY", Rails.application.credentials.dig(:stripe, :publishable_key))
  end

  def self.webhook_secret
    ENV.fetch("STRIPE_WEBHOOK_SECRET", Rails.application.credentials.dig(:stripe, :webhook_secret))
  end
end
