module HaversineDistance
  EARTH_RADIUS_MILES = 3958.8

  module_function

  # Latitude degrees are ~69 miles apart everywhere; longitude degrees shrink towards the poles.
  DEGREES_PER_MILE_LAT = 1 / 69.0

  # A square that is guaranteed to contain every point within `miles` of the origin. Cheap to
  # express in SQL and index-friendly, so it narrows the candidate set to something small before
  # the exact Haversine check runs in Ruby. Slightly over-inclusive by design -- the corners of the
  # square sit outside the circle -- which is why callers still filter with miles_between.
  def bounding_box(latitude, longitude, miles)
    lat_delta = miles * DEGREES_PER_MILE_LAT
    # cos() guards against a degenerate span near the poles; the app is US-only, so this is
    # belt-and-braces rather than a live concern.
    cos_lat = Math.cos(latitude.to_f * Math::PI / 180).abs
    lng_delta = cos_lat < 0.01 ? 180.0 : lat_delta / cos_lat

    {
      min_latitude: latitude.to_f - lat_delta, max_latitude: latitude.to_f + lat_delta,
      min_longitude: longitude.to_f - lng_delta, max_longitude: longitude.to_f + lng_delta
    }
  end

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
