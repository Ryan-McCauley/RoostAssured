class Report < ApplicationRecord
  REASONS = %w[no_show inappropriate_behavior unsafe_conditions payment_dispute spam other].freeze
  STATUSES = %w[pending reviewed dismissed].freeze

  belongs_to :reporter, class_name: "User"
  belongs_to :reported_user, class_name: "User"
  belongs_to :bid, optional: true

  validates :reason, inclusion: { in: REASONS }
  validates :status, inclusion: { in: STATUSES }
  validate :cannot_report_self

  def as_json_public
    {
      id: id, reason: reason, details: details, status: status, created_at: created_at,
      reported_user: { id: reported_user_id, name: reported_user.name },
      reporter: { id: reporter_id, name: reporter.name },
      bid_id: bid_id
    }
  end

  private

  def cannot_report_self
    errors.add(:reported_user_id, "can't be yourself") if reporter_id.present? && reporter_id == reported_user_id
  end
end
