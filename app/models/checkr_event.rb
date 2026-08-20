class CheckrEvent < ApplicationRecord
  validates :checkr_event_id, presence: true, uniqueness: true

  # Returns true if this event hasn't been processed before (and records it), false if it's a duplicate delivery.
  def self.create_if_new(checkr_event_id)
    create!(checkr_event_id: checkr_event_id)
    true
  rescue ActiveRecord::RecordNotUnique
    false
  end
end
