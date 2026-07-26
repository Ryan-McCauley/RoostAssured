class WaitlistSignup < ApplicationRecord
  ROLES = %w[owner sitter both].freeze
  REFERRAL_CODE_LENGTH = 8

  belongs_to :referrer, class_name: "WaitlistSignup", foreign_key: :referred_by_id,
                         counter_cache: :referrals_count, optional: true
  has_many :referrals, class_name: "WaitlistSignup", foreign_key: :referred_by_id, inverse_of: :referrer

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                     format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, inclusion: { in: ROLES }, allow_blank: true
  validates :state, inclusion: { in: User::STATES.keys }, allow_blank: true
  validates :zip_code, format: { with: /\A\d{5}\z/, message: "must be a 5-digit ZIP code" }, allow_blank: true
  validate :referrer_is_not_self
  validate :sitting_end_date_after_start_date

  before_save { email.downcase! }
  before_create :generate_referral_code

  def matching_sitters
    return Sitter.none if zip_code.blank? && (city.blank? || state.blank?)

    scope = Sitter.joins(:user)
    scope = zip_code.present? ? scope.where(users: { zip_code: zip_code }) : scope.where(users: { city: city, state: state })

    if sitting_start_date.present? && sitting_end_date.present?
      scope = scope.joins(:availabilities).merge(Availability.overlapping(sitting_start_date, sitting_end_date)).distinct
    end

    scope
  end

  def looking_for_sitter?
    role != "sitter"
  end

  private

  def sitting_end_date_after_start_date
    return unless sitting_start_date.present? && sitting_end_date.present?

    errors.add(:sitting_end_date, "must be on or after the start date") if sitting_end_date < sitting_start_date
  end

  def referrer_is_not_self
    return unless referrer && email.present?

    errors.add(:base, "You can't refer yourself") if referrer.email.to_s.casecmp?(email)
  end

  def generate_referral_code
    self.referral_code = loop do
      code = SecureRandom.alphanumeric(REFERRAL_CODE_LENGTH)
      break code unless WaitlistSignup.exists?(referral_code: code)
    end
  end
end
