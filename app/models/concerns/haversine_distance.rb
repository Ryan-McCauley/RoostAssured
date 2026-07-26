module HaversineDistance
  EARTH_RADIUS_MILES = 3958.8

  module_function

  def miles_between(lat1, lng1, lat2, lng2)
    return nil if [ lat1, lng1, lat2, lng2 ].any?(&:nil?)

    rlat1, rlat2 = lat1.to_f * Math::PI / 180, lat2.to_f * Math::PI / 180
    dlat = (lat2.to_f - lat1.to_f) * Math::PI / 180
    dlng = (lng2.to_f - lng1.to_f) * Math::PI / 180

    a = Math.sin(dlat / 2)**2 + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(dlng / 2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    EARTH_RADIUS_MILES * c
  end
end
