class WaitlistSignup < ApplicationRecord
  ROLES = %w[owner sitter both].freeze

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                     format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :role, inclusion: { in: ROLES }, allow_blank: true

  before_save { email.downcase! }
end
