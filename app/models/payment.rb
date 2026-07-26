class Payment < ApplicationRecord
  STATUSES = %w[pending succeeded failed refunded].freeze

  belongs_to :bid

  validates :stripe_payment_intent_id, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }
  validates :amount, :application_fee_amount, presence: true, numericality: { greater_than: 0 }

  def as_admin_json
    {
      id: id, status: status, amount: amount, application_fee_amount: application_fee_amount,
      accepted_dates: accepted_dates, created_at: created_at,
      bid: {
        id: bid.id, amount: bid.amount,
        sitter: { id: bid.sitter.id, name: bid.sitter.name },
        owner: { id: bid.owner.id, name: bid.owner.name }
      }
    }
  end
end
