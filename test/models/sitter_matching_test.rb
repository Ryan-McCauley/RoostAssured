require "test_helper"

# Matching narrows candidates with a SQL bounding box before the exact Haversine test. The box is
# deliberately over-inclusive -- its corners sit outside the circle -- so these tests check that the
# circle, not the box, is what actually decides.
class SitterMatchingTest < ActiveSupport::TestCase
  setup do
    @sitter = sitters(:sam)
    @sitter.user.update_columns(latitude: 32.5000, longitude: -94.7000)
    @sitter.update!(travel_radius_miles: 10)
  end

  def owner_at(latitude, longitude, email:)
    User.create!(name: "Owner", email_address: email, password: "password123").tap do |user|
      user.update_columns(latitude: latitude, longitude: longitude, sitting_dates: [ Date.current + 5 ])
    end
  end

  test "includes an owner inside the radius" do
    owner = owner_at(32.5100, -94.7000, email: "near@example.com")

    assert_includes @sitter.matching_job_requests, owner
  end

  test "excludes an owner beyond the radius" do
    owner = owner_at(33.5000, -94.7000, email: "far@example.com")

    assert_not_includes @sitter.matching_job_requests, owner
  end

  test "excludes a corner-of-the-box owner that the circle rules out" do
    # ~9.9 miles north AND ~9.9 miles east: inside the bounding square, but ~14 miles away, so
    # outside the 10-mile circle. A box-only filter would wrongly include this one.
    box = HaversineDistance.bounding_box(32.5, -94.7, 10)
    owner = owner_at(box[:max_latitude] - 0.001, box[:max_longitude] - 0.001, email: "corner@example.com")

    distance = HaversineDistance.miles_between(32.5, -94.7, owner.latitude, owner.longitude)
    assert_operator distance, :>, 10, "fixture should sit outside the circle"
    assert_not_includes @sitter.matching_job_requests, owner
  end

  test "excludes an owner whose only requested dates are in the past" do
    owner = owner_at(32.5100, -94.7000, email: "past@example.com")
    owner.update_columns(sitting_dates: [ Date.current - 5 ])

    assert_not_includes @sitter.matching_job_requests, owner
  end

  test "returns nearest first with the distance already computed" do
    near = owner_at(32.5050, -94.7000, email: "a@example.com")
    further = owner_at(32.5150, -94.7000, email: "b@example.com")

    matches = @sitter.matching_job_requests_with_distance
    owners = matches.map(&:first)

    assert_operator owners.index(near), :<, owners.index(further)
    assert matches.all? { |_, distance| distance.is_a?(Numeric) }
  end

  test "a deactivated sitter matches nothing" do
    owner_at(32.5100, -94.7000, email: "someone@example.com")
    @sitter.deactivate!

    assert_empty @sitter.matching_job_requests
  end

  test "ratings read from a preloaded association without extra queries" do
    Bid.create!(sitter: @sitter, owner: owner_at(32.51, -94.70, email: "r1@example.com"), amount: 20, status: "accepted", rating: 4)
    Bid.create!(sitter: @sitter, owner: owner_at(32.52, -94.70, email: "r2@example.com"), amount: 20, status: "accepted", rating: 5)

    preloaded = Sitter.includes(:bids).find(@sitter.id)
    assert_no_queries do
      assert_equal 4.5, preloaded.average_rating
      assert_equal 2, preloaded.ratings_count
    end
  end
end
