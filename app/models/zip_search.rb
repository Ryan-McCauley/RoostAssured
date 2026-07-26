class ZipSearch < ApplicationRecord
  validates :city, presence: true
  validates :state, inclusion: { in: User::STATES.keys }
  validates :zip_code, presence: true, format: { with: /\A\d{5}\z/, message: "must be a 5-digit ZIP code" }
end
