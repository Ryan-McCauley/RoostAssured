def safe_checkr_credentials
  Rails.application.credentials.checkr || {}
rescue ActiveSupport::MessageEncryptor::InvalidMessage, ActiveSupport::EncryptedFile::MissingKeyError, ArgumentError
  {}
end

module CheckrConfig
  API_BASE_URL = "https://api.checkr.com/v1"

  # The package "slug" (screening bundle) configured in the Checkr dashboard, e.g. "driver_pro".
  PACKAGE = ENV.fetch("CHECKR_PACKAGE", "tasker_pro")

  def self.api_key
    ENV.fetch("CHECKR_API_KEY") { safe_checkr_credentials[:api_key] }
  end

  def self.webhook_key
    ENV.fetch("CHECKR_WEBHOOK_KEY") { safe_checkr_credentials[:webhook_key] }
  end

  def self.configured?
    api_key.present?
  end
end
