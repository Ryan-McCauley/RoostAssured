class Payment < ApplicationRecord
  STATUSES = %w[pending succeeded failed refunded].freeze

  belongs_to :bid

  # Written before the charge and used as the Stripe idempotency key, so a retry that reaches
  # Stripe twice collapses into one PaymentIntent.
  validates :idempotency_key, presence: true, uniqueness: true
  # Absent until Stripe returns -- the row is reserved in `pending` first so the already-paid
  # guard has something committed to see. Unique once present.
  validates :stripe_payment_intent_id, uniqueness: true, allow_nil: true
  validates :status, inclusion: { in: STATUSES }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  # Zero is legitimate: a sitter on fee_percentage: 0 is a waived commission, not an error. This
  # was `greater_than: 0`, which meant such a charge succeeded at Stripe and then raised
  # RecordInvalid on the way to being written down.
  validates :application_fee_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }

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
