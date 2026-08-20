class Sitter < ApplicationRecord
  TRAVEL_RADII = [ 5, 10, 15, 20, 25, 50 ].freeze
  PROFILE_PHOTO_CONTENT_TYPES = %w[image/jpeg image/png image/webp image/heic image/heif].freeze

  belongs_to :user
  has_many :availabilities, dependent: :destroy
  has_many :bids, dependent: :destroy
  has_one_attached :profile_photo

  validates :price_per_visit, presence: true, numericality: { greater_than: 0 }
  validates :background_check_consent, acceptance: { accept: true, message: "is required to become a sitter" }
  validate :profile_photo_is_an_acceptable_file

  delegate :name, :email_address, :city, :state, :zip_code, :latitude, :longitude, to: :user

  def stripe_onboarded?
    stripe_onboarding_status == "complete"
  end

  def needs_stripe_onboarding?
    !stripe_onboarded?
  end

  def active?
    deactivated_at.nil?
  end

  def deactivated?
    !active?
  end

  def deactivate!
    update!(deactivated_at: Time.current)
  end

  def reactivate!
    update!(deactivated_at: nil)
  end

  def matching_job_requests
    return User.none if deactivated?
    return User.none if latitude.blank? || longitude.blank?

    accepted_owner_ids = bids.where(status: "accepted").pluck(:owner_id)
    blocked_owner_ids = user.blocks_initiated.pluck(:blocked_user_id) + user.blocks_received.pluck(:blocker_id)

    User.where.not(id: user_id)
        .where.not(id: accepted_owner_ids)
        .where.not(id: blocked_owner_ids)
        .where.not(latitude: nil, longitude: nil)
        .where("cardinality(sitting_dates) > 0")
        .select { |owner| owner.upcoming_sitting_dates.any? && within_range?(owner) }
        .sort_by { |owner| HaversineDistance.miles_between(latitude, longitude, owner.latitude, owner.longitude) }
  end

  def within_range?(owner)
    distance = HaversineDistance.miles_between(latitude, longitude, owner.latitude, owner.longitude)
    distance.present? && distance <= travel_radius_miles
  end

  def average_rating
    rated = bids.where.not(rating: nil).pluck(:rating)
    return nil if rated.empty?

    (rated.sum.to_f / rated.size).round(1)
  end

  def ratings_count
    bids.where.not(rating: nil).count
  end

  def profile_photo_url
    profile_photo.attached? ? Rails.application.routes.url_helpers.rails_blob_path(profile_photo, only_path: true) : nil
  end

  def as_json_public
    {
      id: id, user_id: user_id, name: name, city: city, state: state, zip_code: zip_code,
      bio: bio, price_per_visit: price_per_visit, years_experience: years_experience,
      own_flock: own_flock, travel_radius_miles: travel_radius_miles,
      background_check_consent: background_check_consent, created_at: created_at,
      stripe_onboarding_status: stripe_onboarding_status, needs_stripe_onboarding: needs_stripe_onboarding?,
      average_rating: average_rating, ratings_count: ratings_count, profile_photo_url: profile_photo_url
    }
  end

  def as_admin_json
    as_json_public.merge(email_address: email_address, deactivated: deactivated?, deactivated_at: deactivated_at)
  end

  private

  def profile_photo_is_an_acceptable_file
    return unless profile_photo.attached?

    errors.add(:profile_photo, "must be JPEG, PNG, WebP, or HEIC") unless profile_photo.content_type.in?(PROFILE_PHOTO_CONTENT_TYPES)
    errors.add(:profile_photo, "must be under 10MB") if profile_photo.blob.byte_size > 10.megabytes
  end
end
