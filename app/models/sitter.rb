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

  # Whether this sitter is allowed to bid on a given owner at all. The bid endpoints derive
  # authorization from this rather than trusting the owner_id in the URL -- otherwise eligibility
  # is only ever enforced by the query that builds the index page, and anyone can POST around it.
  def can_bid_on?(owner)
    return false if deactivated? || owner.nil? || owner.id == user_id
    return false if user.blocked?(owner)
    return false if owner.upcoming_sitting_dates.empty?

    within_range?(owner)
  end

  # Returns [owner, distance_miles] pairs, nearest first. Distance is computed once and handed back
  # rather than recalculated by the caller for display.
  def matching_job_requests_with_distance
    return [] if deactivated?
    return [] if latitude.blank? || longitude.blank?

    excluded_ids = [ user_id ] +
                   bids.where(status: "accepted").pluck(:owner_id) +
                   user.blocks_initiated.pluck(:blocked_user_id) +
                   user.blocks_received.pluck(:blocker_id)

    User.where.not(id: excluded_ids)
        # Deliberately two clauses: `where.not(latitude: nil, longitude: nil)` compiles to
        # NOT (latitude IS NULL AND longitude IS NULL), which lets a half-geocoded row through.
        .where.not(latitude: nil).where.not(longitude: nil)
        .where("cardinality(sitting_dates) > 0")
        # The box does the coarse work in SQL so only nearby rows are loaded; the exact circle test
        # below still decides. Previously every geocoded owner in the table came into memory.
        .within_bounding_box(latitude, longitude, travel_radius_miles)
        .filter_map { |owner|
          next unless owner.upcoming_sitting_dates.any?

          distance = HaversineDistance.miles_between(latitude, longitude, owner.latitude, owner.longitude)
          [ owner, distance ] if distance.present? && distance <= travel_radius_miles
        }
        .sort_by(&:last)
  end

  def matching_job_requests
    matching_job_requests_with_distance.map(&:first)
  end

  def within_range?(owner)
    distance = HaversineDistance.miles_between(latitude, longitude, owner.latitude, owner.longitude)
    distance.present? && distance <= travel_radius_miles
  end

  # Both of these are called from as_json_public, so they run once per sitter in any list. Reading
  # from the association when it has been preloaded turns two queries per sitter into none.
  def rated_bids
    bids.loaded? ? bids.select { |bid| bid.rating.present? } : bids.where.not(rating: nil)
  end

  def average_rating
    ratings = rated_bids.map(&:rating)
    return nil if ratings.empty?

    (ratings.sum.to_f / ratings.size).round(1)
  end

  def ratings_count
    rated_bids.size
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
