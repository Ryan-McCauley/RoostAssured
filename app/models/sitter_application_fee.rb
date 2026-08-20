class SitterApplicationFee < ApplicationRecord
  STATUSES = %w[pending succeeded failed].freeze

  belongs_to :user
  belongs_to :sitter_application, optional: true

  validates :stripe_payment_intent_id, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
  validates :amount, presence: true, numericality: { greater_than: 0 }

  scope :succeeded, -> { where(status: "succeeded") }

  def succeeded?
    status == "succeeded"
  end
end
