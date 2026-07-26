# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Launch region: East Texas, where Roost Assured is first going live.
[
  { name: "Gilmer, Tx", latitude: 32.728803, longitude: -94.944557, radius_miles: 25 },
  { name: "Longview, Texas, USA", latitude: 32.500703, longitude: -94.74049, radius_miles: 20 },
  { name: "Gladewater, Tx", latitude: 32.536533, longitude: -94.942717, radius_miles: 20 }
].each do |attrs|
  ServiceArea.find_or_create_by!(name: attrs[:name]) do |area|
    area.latitude = attrs[:latitude]
    area.longitude = attrs[:longitude]
    area.radius_miles = attrs[:radius_miles]
  end
end

# A handful of real sitters in the launch region so "active service area" pages have live data to show.
[
  { name: "Marisol Reyes", email_address: "marisol@example.com", city: "Gilmer", state: "TX", zip_code: "75644",
    price_per_visit: 18, years_experience: 4, own_flock: true, travel_radius_miles: 15,
    bio: "Raised chickens my whole life — happy to keep an eye on your flock." },
  { name: "Dale Whitfield", email_address: "dale@example.com", city: "Longview", state: "TX", zip_code: "75601",
    price_per_visit: 22, years_experience: 7, own_flock: true, travel_radius_miles: 20,
    bio: "Retired vet tech, currently keeping 12 hens of my own." },
  { name: "Priya Patel", email_address: "priya@example.com", city: "Gladewater", state: "TX", zip_code: "75647",
    price_per_visit: 15, years_experience: 2, own_flock: false, travel_radius_miles: 10,
    bio: "Weekend chicken sitter, flexible schedule, great with skittish birds." }
].each do |attrs|
  user_attrs = attrs.slice(:name, :email_address, :city, :state, :zip_code)
  sitter_attrs = attrs.slice(:price_per_visit, :years_experience, :own_flock, :travel_radius_miles, :bio)

  user = User.find_or_create_by!(email_address: user_attrs[:email_address]) do |u|
    u.assign_attributes(user_attrs.merge(password: "password123"))
  end
  user.create_sitter!(sitter_attrs.merge(background_check_consent: true)) unless user.sitter
end

# Continental US bounding box — coordinates don't need to match the fake city exactly,
# they only need to be plausible for map/distance testing.
LAT_RANGE = 24.5..49.0
LNG_RANGE = -124.7..-66.9

# Simulate 100,000 landing-page ZIP searches from a pool of unique locations, weighted so
# ~20% of locations account for ~80% of the searches — real search traffic is long-tailed
# (a handful of popular ZIPs get searched repeatedly, most are one-offs), not uniform.
# Exercises the admin "Locations searched" dashboard with realistic volume. Development only.
if Rails.env.development? && ZipSearch.count < 100_000
  pool_size = 120
  total_searches = 100_000

  locations = Array.new(pool_size) do
    city, state = nil

    loop do
      city = Faker::Address.city
      state = Faker::Address.state_abbr
      break if User::STATES.key?(state)
    end

    {
      city: city,
      state: state,
      zip_code: rand(10_000..99_999).to_s,
      latitude: rand(LAT_RANGE).round(6),
      longitude: rand(LNG_RANGE).round(6)
    }
  end

  # Zipf-like rank weighting (weight ∝ 1 / rank^1.2) concentrates the bulk of volume in the
  # top-ranked locations, which is what an 80/20 split looks like in practice.
  ranked_weights = (1..pool_size).map { |rank| 1.0 / (rank ** 1.2) }
  weight_sum = ranked_weights.sum
  counts = ranked_weights.map { |w| (w / weight_sum * total_searches).round }

  # Rounding can drift the total slightly off total_searches — true it up on the top location.
  counts[0] += total_searches - counts.sum

  now = Time.current
  rows = locations.each_with_index.flat_map do |location, i|
    Array.new(counts[i]) do
      created_at = now - rand(0..90.days) - rand(0..86_400).seconds
      location.merge(
        latitude: (location[:latitude] + rand(-0.05..0.05)).round(6),
        longitude: (location[:longitude] + rand(-0.05..0.05)).round(6),
        created_at: created_at,
        updated_at: created_at
      )
    end
  end
  ZipSearch.insert_all(rows)

  top = ZipSearch.group(:city, :state).count.max_by { |_, count| count }
  puts "Seeded #{ZipSearch.count} zip searches across #{pool_size} locations (top: #{top.first.join(', ')} with #{top.last})."
end

# Cities where backyard chicken keeping is especially common, weighted so the heat map
# looks like real, geographically clustered traffic instead of noise scattered across the
# whole country. Sources: Redfin's "Best Cities to Be a Chicken" ranking (homes listed with
# chicken coops — Portland OR, Ventura/San Diego/Sacramento CA, Seattle WA), plus cities
# widely documented as permissive of and popular for backyard/urban chickens (Austin and the
# major Texas metros, Madison WI, Washington DC, Knoxville/Chattanooga TN, Petaluma CA — the
# historic "Egg Capital of the World" — and other cities with active urban-agriculture/
# homesteading scenes). East Texas gets the heaviest weight since it's Roost Assured's launch
# region.
CHICKEN_CITIES = [
  # [name, state, latitude, longitude, weight] — weight is relative traffic share.
  # Launch region: East Texas
  [ "Gilmer", "TX", 32.7288, -94.9446, 40 ],
  [ "Longview", "TX", 32.5007, -94.7405, 36 ],
  [ "Gladewater", "TX", 32.5365, -94.9427, 30 ],
  [ "Tyler", "TX", 32.3513, -95.3011, 34 ],
  [ "Marshall", "TX", 32.5449, -94.3674, 22 ],
  [ "Kilgore", "TX", 32.3868, -94.8752, 18 ],
  [ "Henderson", "TX", 32.1532, -94.7999, 16 ],
  # Redfin's top "best cities to be a chicken" (by chicken-coop home listings)
  [ "Portland", "OR", 45.5152, -122.6784, 32 ],
  [ "Ventura", "CA", 34.2746, -119.2290, 18 ],
  [ "San Diego", "CA", 32.7157, -117.1611, 24 ],
  [ "Sacramento", "CA", 38.5816, -121.4944, 22 ],
  [ "Seattle", "WA", 47.6062, -122.3321, 26 ],
  # Texas metros — broadly permissive of backyard flocks
  [ "Austin", "TX", 30.2672, -97.7431, 30 ],
  [ "Houston", "TX", 29.7604, -95.3698, 26 ],
  [ "Dallas", "TX", 32.7767, -96.7970, 24 ],
  [ "Fort Worth", "TX", 32.7555, -97.3308, 20 ],
  [ "San Antonio", "TX", 29.4241, -98.4936, 20 ],
  # Other cities with well-documented urban-chicken/homesteading culture
  [ "Madison", "WI", 43.0731, -89.4012, 18 ],
  [ "Washington", "DC", 38.9072, -77.0369, 16 ],
  [ "Knoxville", "TN", 35.9606, -83.9207, 14 ],
  [ "Chattanooga", "TN", 35.0456, -85.3097, 14 ],
  [ "Petaluma", "CA", 38.2324, -122.6367, 16 ],
  [ "Asheville", "NC", 35.5951, -82.5515, 20 ],
  [ "Nashville", "TN", 36.1627, -86.7816, 18 ],
  [ "Athens", "GA", 33.9519, -83.3576, 14 ],
  [ "Atlanta", "GA", 33.7490, -84.3880, 18 ],
  [ "Raleigh", "NC", 35.7796, -78.6382, 16 ],
  [ "Durham", "NC", 35.9940, -78.8986, 14 ],
  [ "Charlotte", "NC", 35.2271, -80.8431, 16 ],
  [ "Richmond", "VA", 37.5407, -77.4360, 14 ],
  [ "Charlottesville", "VA", 38.0293, -78.4767, 10 ],
  [ "Louisville", "KY", 38.2527, -85.7585, 14 ],
  [ "Lexington", "KY", 38.0406, -84.5037, 12 ],
  [ "Columbus", "OH", 39.9612, -82.9988, 14 ],
  [ "Cincinnati", "OH", 39.1031, -84.5120, 12 ],
  [ "Cleveland", "OH", 41.4993, -81.6944, 10 ],
  [ "Pittsburgh", "PA", 40.4406, -79.9959, 12 ],
  [ "Philadelphia", "PA", 39.9526, -75.1652, 14 ],
  [ "Burlington", "VT", 44.4759, -73.2121, 12 ],
  [ "Portland", "ME", 43.6591, -70.2568, 10 ],
  [ "Providence", "RI", 41.8240, -71.4128, 10 ],
  [ "Minneapolis", "MN", 44.9778, -93.2650, 16 ],
  [ "St. Paul", "MN", 44.9537, -93.0900, 12 ],
  [ "Milwaukee", "WI", 43.0389, -87.9065, 12 ],
  [ "Kansas City", "MO", 39.0997, -94.5786, 14 ],
  [ "St. Louis", "MO", 38.6270, -90.1994, 12 ],
  [ "Springfield", "MO", 37.2090, -93.2923, 10 ],
  [ "Tulsa", "OK", 36.1540, -95.9928, 12 ],
  [ "Oklahoma City", "OK", 35.4676, -97.5164, 12 ],
  [ "Little Rock", "AR", 34.7465, -92.2896, 10 ],
  [ "Fayetteville", "AR", 36.0626, -94.1574, 12 ],
  [ "Jackson", "MS", 32.2988, -90.1848, 8 ],
  [ "Birmingham", "AL", 33.5207, -86.8025, 10 ],
  [ "Huntsville", "AL", 34.7304, -86.5861, 10 ],
  [ "Baton Rouge", "LA", 30.4515, -91.1871, 10 ],
  [ "New Orleans", "LA", 29.9511, -90.0715, 12 ],
  [ "Shreveport", "LA", 32.5252, -93.7502, 10 ],
  [ "Tucson", "AZ", 32.2226, -110.9747, 12 ],
  [ "Phoenix", "AZ", 33.4484, -112.0740, 14 ],
  [ "Flagstaff", "AZ", 35.1983, -111.6513, 8 ],
  [ "Albuquerque", "NM", 35.0844, -106.6504, 12 ],
  [ "Santa Fe", "NM", 35.6870, -105.9378, 8 ],
  [ "Salt Lake City", "UT", 40.7608, -111.8910, 14 ],
  [ "Bozeman", "MT", 45.6770, -111.0429, 8 ],
  [ "Missoula", "MT", 46.8721, -113.9940, 8 ],
  [ "Spokane", "WA", 47.6588, -117.4260, 10 ],
  [ "Bellingham", "WA", 48.7519, -122.4787, 10 ],
  [ "Olympia", "WA", 47.0379, -122.9007, 8 ],
  [ "Eugene", "OR", 44.0521, -123.0868, 12 ],
  [ "Bend", "OR", 44.0582, -121.3153, 10 ],
  [ "Fresno", "CA", 36.7378, -119.7871, 10 ],
  [ "Santa Cruz", "CA", 36.9741, -122.0308, 10 ],
  [ "Berkeley", "CA", 37.8715, -122.2730, 12 ],
  [ "Oakland", "CA", 37.8044, -122.2712, 12 ],
  [ "Los Angeles", "CA", 34.0522, -118.2437, 16 ],
  [ "Chico", "CA", 39.7285, -121.8375, 8 ],
  [ "Boulder", "CO", 40.0150, -105.2705, 12 ],
  [ "Fort Collins", "CO", 40.5853, -105.0844, 12 ],
  [ "Colorado Springs", "CO", 38.8339, -104.8214, 10 ],
  [ "Denver", "CO", 39.7392, -104.9903, 16 ],
  [ "Boise", "ID", 43.6150, -116.2023, 12 ],
  [ "Traverse City", "MI", 44.7631, -85.6206, 8 ],
  [ "Ann Arbor", "MI", 42.2808, -83.7430, 12 ],
  [ "Grand Rapids", "MI", 42.9634, -85.6681, 10 ],
  [ "Detroit", "MI", 42.3314, -83.0458, 10 ],
  [ "Indianapolis", "IN", 39.7684, -86.1581, 10 ],
  [ "Bloomington", "IN", 39.1653, -86.5264, 10 ],
  [ "Des Moines", "IA", 41.5868, -93.6250, 10 ],
  [ "Iowa City", "IA", 41.6611, -91.5302, 8 ],
  [ "Lincoln", "NE", 40.8136, -96.7026, 8 ],
  [ "Omaha", "NE", 41.2565, -95.9345, 10 ],
  [ "Wichita", "KS", 37.6872, -97.3301, 8 ],
  [ "Lawrence", "KS", 38.9717, -95.2353, 8 ],
  [ "Jacksonville", "FL", 30.3322, -81.6557, 10 ],
  [ "Gainesville", "FL", 29.6516, -82.3248, 10 ],
  [ "Tampa", "FL", 27.9506, -82.4572, 12 ],
  [ "Orlando", "FL", 28.5383, -81.3792, 10 ],
  [ "Sarasota", "FL", 27.3364, -82.5307, 8 ],
  [ "Savannah", "GA", 32.0809, -81.0912, 10 ],
  [ "Charleston", "SC", 32.7765, -79.9311, 12 ],
  [ "Columbia", "SC", 34.0007, -81.0348, 8 ],
  [ "Greenville", "SC", 34.8526, -82.3940, 10 ],
  [ "Roanoke", "VA", 37.2710, -79.9414, 8 ],
  [ "Harrisonburg", "VA", 38.4496, -78.8689, 8 ],
  [ "Ithaca", "NY", 42.4440, -76.5019, 10 ],
  [ "Rochester", "NY", 43.1566, -77.6088, 8 ],
  [ "Buffalo", "NY", 42.8864, -78.8784, 8 ]
].freeze

# Weighted pool: each city index appears `weight` times, so a plain #sample yields a
# realistic, geographically clustered distribution instead of a uniform pick.
CHICKEN_CITY_POOL = CHICKEN_CITIES.each_index.flat_map { |i| [ i ] * CHICKEN_CITIES[i][4] }.freeze

# Simulate 100,000 front-page hits for the admin heat map, clustered around real cities
# known for backyard chicken keeping (see CHICKEN_CITIES above) rather than uniform noise.
# Development only — real page views are tracked (and geolocated via IpGeolocator)
# automatically as the app is used.
if Rails.env.development? && PageView.count < 100_000
  now = Time.current

  rows = Array.new(100_000) do
    _name, _state, lat, lng, = CHICKEN_CITIES[CHICKEN_CITY_POOL.sample]

    # Jitter within roughly a 15-mile radius of the city center so hits don't all land on
    # the exact same point, then spread timestamps over the last 90 days.
    jitter_lat = lat + rand(-0.2..0.2)
    jitter_lng = lng + rand(-0.2..0.2)
    created_at = now - rand(0..90.days) - rand(0..86_400).seconds

    {
      ip_address: Faker::Internet.ip_v4_address,
      path: "/",
      latitude: jitter_lat.round(6),
      longitude: jitter_lng.round(6),
      created_at: created_at,
      updated_at: created_at
    }
  end
  PageView.insert_all(rows)

  puts "Seeded #{PageView.count} page views across #{CHICKEN_CITIES.size} chicken-friendly cities."
end

# 100 owner accounts with realistic, varied flock/care profiles, limited to the three
# active service-area towns (Gilmer, Longview, Gladewater — see ServiceArea seed above)
# so every seeded owner actually falls inside a live service area and within reach of the
# seeded sitters. Every seeded user gets full contact/address info, since that's now
# required on any record carrying sitting_dates.
#
# A user's `sitting_dates` is a flat array of individual dates, not a separate table of
# discrete bookings — one user can hold more than one distinct request (e.g. "this
# weekend" and "again next month"). So the 150 "job requests" here are 150 distinct
# booking-window clusters, randomly distributed across the 100 users (some users end up
# with none, most with one, a handful with two or three), rather than a strict 1:1.
SEED_OWNER_CITIES = [
  [ "Gilmer", "TX", 32.728803, -94.944557, "75644" ],
  [ "Longview", "TX", 32.500703, -94.74049, "75601" ],
  [ "Gladewater", "TX", 32.536533, -94.942717, "75647" ]
].freeze

existing_seed_owners = User.where("email_address LIKE 'seed_owner_%'")
seed_owners_need_rebuild = existing_seed_owners.count != 100 ||
  existing_seed_owners.where.not(city: SEED_OWNER_CITIES.map(&:first)).exists?

if Rails.env.development? && seed_owners_need_rebuild
  existing_seed_owners.find_each do |owner|
    owner.bids_received.destroy_all
    owner.destroy
  end

  TOTAL_SEED_USERS = 100
  TOTAL_JOB_REQUESTS = 150

  # Assign each of the 150 requests to a random user index up front, so the distribution
  # of "how many requests does this user have" falls out naturally instead of being
  # hand-tuned.
  request_owner_indexes = Array.new(TOTAL_JOB_REQUESTS) { rand(TOTAL_SEED_USERS) }
  requests_by_owner = request_owner_indexes.group_by(&:itself)

  HAZARDS = ["hawks circling this spring", "a raccoon that's figured out the latch", "a dog next door that barks at the coop", "a fox sighting last month"].freeze

  # Skip the live geocoding callback for this bulk insert — we already have real lat/lng
  # for each chosen city, and hitting Nominatim 100+ times here would be slow and likely
  # to get rate-limited.
  User.skip_callback(:save, :after, :geocode_zip_code)

  begin
    ActiveRecord::Base.transaction do
      TOTAL_SEED_USERS.times do |i|
        city_name, state, base_lat, base_lng, zip = SEED_OWNER_CITIES.sample

        user = User.create!(
          name: Faker::Name.name,
          email_address: "seed_owner_#{i}@example.com",
          password: "password123",
          password_confirmation: "password123",
          phone_number: Faker::PhoneNumber.cell_phone,
          address: Faker::Address.street_address,
          city: city_name,
          state: state,
          zip_code: zip,
          flock_size_tier: User::FLOCK_SIZE_TIERS.keys.sample,
          coop_features: User::COOP_FEATURES.sample(rand(1..3)),
          sitting_type: User::SITTING_TYPES.sample,
          care_tasks: User::CARE_TASKS.sample(rand(1..User::CARE_TASKS.size)),
          other_care_task: rand < 0.25 ? Faker::Lorem.sentence(word_count: 4) : "",
          feeder_count: rand(1..4),
          waterer_count: rand(1..3),
          feed_location: Faker::Lorem.sentence(word_count: 5),
          water_location: Faker::Lorem.sentence(word_count: 5),
          special_requests: rand < 0.35 ? "Watch out for #{HAZARDS.sample}." : ""
        )
        user.update_columns(
          latitude: (base_lat + rand(-0.03..0.03)).round(6),
          longitude: (base_lng + rand(-0.03..0.03)).round(6)
        )

        request_count = (requests_by_owner[i] || []).size
        next if request_count.zero?

        dates = Array.new(request_count) do
          start = Date.current + rand(2..45)
          (start...(start + rand(1..5))).to_a
        end.flatten.uniq.sort
        user.update!(sitting_dates: dates)
      end
    end
  ensure
    User.set_callback(:save, :after, :geocode_zip_code, if: :saved_change_to_zip_code?)
  end

  owners_with_requests = requests_by_owner.size
  puts "Seeded #{TOTAL_SEED_USERS} owner users with #{TOTAL_JOB_REQUESTS} job-request clusters across #{owners_with_requests} owners with an open request."
end
