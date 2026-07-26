class ServiceArea < ApplicationRecord
  RADII = [ 1, 3, 5, 10, 15, 20, 25, 50 ].freeze

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validates :latitude, presence: true, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :longitude, presence: true, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }
  validates :radius_miles, presence: true, numericality: { only_integer: true, greater_than: 0 }

  def self.live?(lat, lng)
    return false if lat.blank? || lng.blank?

    all.any? do |area|
      HaversineDistance.miles_between(lat.to_f, lng.to_f, area.latitude.to_f, area.longitude.to_f) <= area.radius_miles
    end
  end
end
