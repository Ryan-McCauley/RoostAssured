require "test_helper"

class NominatimGeocoderTest < ActiveSupport::TestCase
  setup do
    @cache = Rails.cache
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
  end

  teardown { Rails.cache = @cache }

  test "a repeated lookup hits the network once" do
    calls = 0
    with_instance_method(NominatimGeocoder.singleton_class, :uncached_search,
                         ->(_query) { calls += 1; NominatimGeocoder::Result.new(32.5, -94.7) }) do
      3.times { NominatimGeocoder.geocode("75601") }
    end

    assert_equal 1, calls, "the same ZIP should not be re-geocoded on every request"
  end

  test "a lookup that finds nothing is also cached, so a bogus ZIP stops hitting the network" do
    calls = 0
    with_instance_method(NominatimGeocoder.singleton_class, :uncached_search,
                         ->(_query) { calls += 1; nil }) do
      assert_nil NominatimGeocoder.geocode("00000")
      assert_nil NominatimGeocoder.geocode("00000")
    end

    assert_equal 1, calls
  end

  test "returns coordinates from the cached entry" do
    with_instance_method(NominatimGeocoder.singleton_class, :uncached_search,
                         ->(_query) { NominatimGeocoder::Result.new(32.5, -94.7) }) do
      NominatimGeocoder.geocode("75601")
      result = NominatimGeocoder.geocode("75601")

      assert_in_delta 32.5, result.latitude, 0.0001
      assert_in_delta(-94.7, result.longitude, 0.0001)
    end
  end
end
