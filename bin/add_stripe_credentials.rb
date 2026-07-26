#!/usr/bin/env ruby
require_relative "../config/environment"

keys = %w[STRIPE_PUBLISHABLE_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET]
missing = keys.select { |k| ENV[k].nil? || ENV[k].empty? }
if missing.any?
  abort "Missing env vars: #{missing.join(', ')}\n" \
        "Set them first, e.g.:\n" \
        "  STRIPE_PUBLISHABLE_KEY=pk_test_... STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... bin/add_stripe_credentials.rb"
end

Rails.application.credentials.config[:stripe] ||= {}

content = Rails.application.credentials.read
data = YAML.safe_load(content, permitted_classes: [Symbol]) || {}
data["stripe"] = {
  "publishable_key" => ENV["STRIPE_PUBLISHABLE_KEY"],
  "secret_key" => ENV["STRIPE_SECRET_KEY"],
  "webhook_secret" => ENV["STRIPE_WEBHOOK_SECRET"]
}

Rails.application.credentials.write(data.to_yaml)
puts "Stripe keys written to encrypted credentials."
