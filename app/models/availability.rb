class Availability < ApplicationRecord
  belongs_to :sitter

  validates :start_date, presence: true
  validates :end_date, presence: true
  validate :end_date_after_start_date

  scope :overlapping, ->(start_date, end_date) { where("start_date <= ? AND end_date >= ?", end_date, start_date) }

  private

  def end_date_after_start_date
    return unless start_date.present? && end_date.present?

    errors.add(:end_date, "must be on or after the start date") if end_date < start_date
  end
end
