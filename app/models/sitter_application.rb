class SitterApplication < ApplicationRecord
  TRAVEL_RADII = [ 5, 10, 15, 20, 25, 50 ].freeze
  STATUSES = %w[pending approved rejected].freeze
  AVAILABILITY_DAYS = %w[Monday Tuesday Wednesday Thursday Friday Saturday Sunday].freeze
  AVAILABILITY_TIMES = %w[Morning Evening].freeze
  RESUME_CONTENT_TYPES = %w[application/pdf application/msword application/vnd.openxmlformats-officedocument.wordprocessingml.document].freeze

  belongs_to :user
  has_one_attached :resume
  has_many :sitter_application_fees, dependent: :nullify

  validates :first_name, :last_name, presence: true
  validates :street_address, :city, :zip_code, presence: true
  validates :state, inclusion: { in: User::STATES.keys }, allow_blank: true
  validates :status, inclusion: { in: STATUSES }
  validates :price_per_visit, presence: true, numericality: { greater_than: 0 }
  validates :background_check_consent, acceptance: { accept: true, message: "is required to apply" }
  validate :availability_days_are_recognized
  validate :availability_times_are_recognized
  validate :resume_is_an_acceptable_file

  delegate :email_address, to: :user

  def full_name
    [ first_name, middle_name, last_name ].compact_blank.join(" ")
  end

  def pending?
    status == "pending"
  end

  def approved?
    status == "approved"
  end

  def rejected?
    status == "rejected"
  end

  def background_check_cleared?
    background_check_status == "clear"
  end

  def background_check_pending?
    %w[invited pending].include?(background_check_status)
  end

  def background_check_flagged?
    %w[consider suspended dispute].include?(background_check_status)
  end

  # Approval creates a live sitter who will be sent to strangers' homes, which is the entire reason
  # the $50 fee and the Checkr integration exist. These predicates were defined but never consulted
  # anywhere, so an applicant whose report came back `consider` or `suspended` could be approved
  # with one click and no warning. Approval now requires a clear report, or an explicit override
  # that gets recorded on the application.
  def approvable?(override: false)
    background_check_cleared? || override
  end

  def approval_blocked_reason
    return nil if background_check_cleared?

    if background_check_pending?
      "This applicant's background check hasn't come back yet."
    elsif background_check_flagged?
      "This applicant's background check came back \"#{background_check_status}\". Approving anyway requires an explicit override."
    else
      "This applicant has no completed background check."
    end
  end

  def as_json_public
    {
      id: id, email_address: email_address,
      first_name: first_name, middle_name: middle_name, last_name: last_name, full_name: full_name,
      street_address: street_address, city: city, state: state, zip_code: zip_code,
      bio: bio, price_per_visit: price_per_visit, years_experience: years_experience,
      own_flock: own_flock, travel_radius_miles: travel_radius_miles,
      availability_days: availability_days, availability_times: availability_times,
      background_check_consent: background_check_consent, background_check_status: background_check_status, status: status,
      resume_filename: resume.attached? ? resume.filename.to_s : nil,
      resume_url: resume.attached? ? Rails.application.routes.url_helpers.rails_blob_path(resume, only_path: true) : nil,
      reviewed_at: reviewed_at, created_at: created_at
    }
  end

  private

  def availability_days_are_recognized
    return if availability_days.blank?

    errors.add(:availability_days, "contains an unrecognized day") unless availability_days.all? { |d| d.in?(AVAILABILITY_DAYS) }
  end

  def availability_times_are_recognized
    return if availability_times.blank?

    errors.add(:availability_times, "contains an unrecognized time") unless availability_times.all? { |t| t.in?(AVAILABILITY_TIMES) }
  end

  def resume_is_an_acceptable_file
    return unless resume.attached?

    errors.add(:resume, "must be a PDF or Word document") unless resume.content_type.in?(RESUME_CONTENT_TYPES)
    errors.add(:resume, "must be under 10MB") if resume.blob.byte_size > 10.megabytes
  end
end
