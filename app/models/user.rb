class User < ApplicationRecord
  FLOCK_SIZE_TIERS = {
    "Small" => { range: "0-12", description: "A starter flock — easy to keep track of by name." },
    "Medium" => { range: "13-25", description: "A well-established backyard flock." },
    "Large" => { range: "26-50", description: "Serious hobbyist territory — probably selling eggs." },
    "Jumbo" => { range: "51+", description: "Small-farm scale — a sitter should have real flock experience." },
  }.freeze
  COOP_FEATURES = ["Automatic door", "Manual door", "Free range", "Tractor / mobile", "Fully enclosed", "Electric fence"].freeze
  SITTING_TYPES = ["Temporary sitter", "Recurring help & maintenance"].freeze
  CARE_TASKS = ["Feed & water", "Collect eggs", "Welfare check", "Cleaning", "Give treats / supplements"].freeze
  REQUEST_DETAIL_ATTRIBUTES = %w[care_tasks other_care_task special_requests sitting_dates].freeze

  STATES = {
    "AL" => "Alabama", "AK" => "Alaska", "AZ" => "Arizona", "AR" => "Arkansas", "CA" => "California",
    "CO" => "Colorado", "CT" => "Connecticut", "DE" => "Delaware", "DC" => "District of Columbia",
    "FL" => "Florida", "GA" => "Georgia", "HI" => "Hawaii", "ID" => "Idaho", "IL" => "Illinois",
    "IN" => "Indiana", "IA" => "Iowa", "KS" => "Kansas", "KY" => "Kentucky", "LA" => "Louisiana",
    "ME" => "Maine", "MD" => "Maryland", "MA" => "Massachusetts", "MI" => "Michigan", "MN" => "Minnesota",
    "MS" => "Mississippi", "MO" => "Missouri", "MT" => "Montana", "NE" => "Nebraska", "NV" => "Nevada",
    "NH" => "New Hampshire", "NJ" => "New Jersey", "NM" => "New Mexico", "NY" => "New York",
    "NC" => "North Carolina", "ND" => "North Dakota", "OH" => "Ohio", "OK" => "Oklahoma", "OR" => "Oregon",
    "PA" => "Pennsylvania", "RI" => "Rhode Island", "SC" => "South Carolina", "SD" => "South Dakota",
    "TN" => "Tennessee", "TX" => "Texas", "UT" => "Utah", "VT" => "Vermont", "VA" => "Virginia",
    "WA" => "Washington", "WV" => "West Virginia", "WI" => "Wisconsin", "WY" => "Wyoming"
  }.freeze

  has_secure_password
  has_many :sessions, dependent: :destroy
  has_one :sitter, dependent: :destroy
  has_one :sitter_application, dependent: :destroy
  has_many :bids_received, class_name: "Bid", foreign_key: :owner_id, dependent: :destroy, inverse_of: :owner

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  validates :name, presence: true
  validates :email_address, presence: true, uniqueness: { case_sensitive: false },
                             format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :state, inclusion: { in: STATES.keys }, allow_blank: true
  validates :zip_code, format: { with: /\A\d{5}\z/, message: "must be a 5-digit ZIP code" }, allow_blank: true
  validates :flock_size_tier, inclusion: { in: FLOCK_SIZE_TIERS.keys }, allow_blank: true
  validates :sitting_type, inclusion: { in: SITTING_TYPES }, allow_blank: true
  validates :feeder_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validates :waterer_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true
  validate :coop_features_are_recognized
  validate :care_tasks_are_recognized
  validate :sitting_dates_are_not_in_the_past, if: :sitting_dates_changed?
  validate :work_order_contact_details_present, if: -> { sitting_dates.present? }

  after_save :geocode_zip_code, if: :saved_change_to_zip_code?
  after_save :mark_pending_bids_stale, if: :request_details_changed?

  def sitter?
    sitter.present?
  end

  def stripe_customer?
    stripe_customer_id.present?
  end

  def has_payment_method?
    return false unless stripe_customer?

    customer = Stripe::Customer.retrieve(stripe_customer_id)
    customer.invoice_settings.default_payment_method.present?
  end

  def upcoming_sitting_dates
    sitting_dates.select { |d| d >= Date.current }
  end

  def as_json_public
    {
      id: id, name: name, email_address: email_address, phone_number: phone_number, address: address,
      city: city, state: state, zip_code: zip_code,
      flock_size_tier: flock_size_tier, coop_features: coop_features, sitting_type: sitting_type,
      care_tasks: care_tasks, other_care_task: other_care_task,
      feeder_count: feeder_count, waterer_count: waterer_count,
      feed_location: feed_location, water_location: water_location,
      special_requests: special_requests, sitting_dates: sitting_dates,
      created_at: created_at, sitter: sitter&.as_json_public, sitter_application: sitter_application&.as_json_public
    }
  end

  def as_job_request_json(distance_miles: nil, bid: nil)
    {
      id: id, name: name, phone_number: phone_number, address: address,
      city: city, state: state, zip_code: zip_code, latitude: latitude, longitude: longitude,
      distance_miles: distance_miles&.round(1),
      flock_size_tier: flock_size_tier, coop_features: coop_features, sitting_type: sitting_type,
      care_tasks: care_tasks, other_care_task: other_care_task,
      feeder_count: feeder_count, waterer_count: waterer_count,
      feed_location: feed_location, water_location: water_location,
      special_requests: special_requests, sitting_dates: upcoming_sitting_dates,
      my_bid: bid&.as_json_public
    }
  end

  private

  def coop_features_are_recognized
    return if coop_features.blank?

    errors.add(:coop_features, "contains an unrecognized feature") unless coop_features.all? { |f| f.in?(COOP_FEATURES) }
  end

  def care_tasks_are_recognized
    return if care_tasks.blank?

    errors.add(:care_tasks, "contains an unrecognized task") unless care_tasks.all? { |t| t.in?(CARE_TASKS) }
  end

  def sitting_dates_are_not_in_the_past
    newly_added_dates = sitting_dates - (sitting_dates_was || [])
    errors.add(:sitting_dates, "can't include dates in the past") if newly_added_dates.any? { |d| d < Date.current }
  end

  def work_order_contact_details_present
    missing = []
    missing << "phone number" if phone_number.blank?
    missing << "street address" if address.blank?
    missing << "city" if city.blank?
    missing << "state" if state.blank?
    missing << "ZIP code" if zip_code.blank?
    errors.add(:base, "Add your #{missing.to_sentence} before requesting a sitter") if missing.any?
  end

  def geocode_zip_code
    return if zip_code.blank?

    result = NominatimGeocoder.geocode(zip_code)
    update_columns(latitude: result.latitude, longitude: result.longitude) if result
  end

  def request_details_changed?
    REQUEST_DETAIL_ATTRIBUTES.any? { |attr| saved_change_to_attribute?(attr) }
  end

  # When an owner edits the substance of their request (tasks, dates, special requests) after a
  # sitter has already bid on it, that bid was written against the old request — flag it stale so
  # the owner can't accept it blind, and prompt the sitter to review and resubmit.
  def mark_pending_bids_stale
    affected = bids_received.where(status: "submitted", stale: false).to_a
    return if affected.empty?

    Bid.where(id: affected.map(&:id)).update_all(stale: true)
    affected.each { |bid| BidMailer.request_edited(bid).deliver_later }
  end
end
