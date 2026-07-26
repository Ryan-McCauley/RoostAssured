def safe_stripe_credentials
  Rails.application.credentials.stripe || {}
rescue ActiveSupport::MessageEncryptor::InvalidMessage, ActiveSupport::EncryptedFile::MissingKeyError, ArgumentError
  {}
end

Stripe.api_key = ENV.fetch("STRIPE_SECRET_KEY") { safe_stripe_credentials[:secret_key] }
Stripe.api_version = "2024-06-20"

module StripeConfig
  def self.publishable_key
    ENV.fetch("STRIPE_PUBLISHABLE_KEY") { safe_stripe_credentials[:publishable_key] }
  end

  def self.webhook_secret
    ENV.fetch("STRIPE_WEBHOOK_SECRET") { safe_stripe_credentials[:webhook_secret] }
  end
end
