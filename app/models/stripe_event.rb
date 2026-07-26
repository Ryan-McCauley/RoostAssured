class StripeEvent < ApplicationRecord
  validates :stripe_event_id, presence: true, uniqueness: true

  # Returns true if this event hasn't been processed before (and records it), false if it's a duplicate delivery.
  def self.create_if_new(stripe_event_id)
    create!(stripe_event_id: stripe_event_id)
    true
  rescue ActiveRecord::RecordNotUnique
    false
  end
end
