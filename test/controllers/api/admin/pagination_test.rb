require "test_helper"

# Admin indexes used to serialize whole tables. These pin the window, the caps, and -- for
# payments -- that filtering and the summary stats are computed over the whole set rather than
# over whichever page happens to be on screen.
class Api::Admin::PaginationTest < ActionDispatch::IntegrationTest
  setup do
    @auth = { "Authorization" => "Basic #{Base64.strict_encode64('admin:admin')}" }
    WaitlistSignup.delete_all
    120.times { |i| WaitlistSignup.create!(email: "wl#{i}@example.com", city: "Gilmer", state: "TX", zip_code: "75644") }
  end

  def json = JSON.parse(response.body)

  test "a page returns a window plus the meta needed to render controls" do
    get "/api/admin/waitlist_signups", headers: @auth

    assert_response :success
    assert_equal 50, json["waitlist_signups"].size
    assert_equal({ "page" => 1, "per_page" => 50, "total_count" => 120, "total_pages" => 3 }, json["meta"])
  end

  test "the last page returns the remainder" do
    get "/api/admin/waitlist_signups", params: { page: 3 }, headers: @auth

    assert_equal 20, json["waitlist_signups"].size
    assert_equal 3, json["meta"]["page"]
  end

  test "pages do not overlap" do
    get "/api/admin/waitlist_signups", params: { page: 1 }, headers: @auth
    first = json["waitlist_signups"].map { |w| w["id"] }
    get "/api/admin/waitlist_signups", params: { page: 2 }, headers: @auth
    second = json["waitlist_signups"].map { |w| w["id"] }

    assert_empty first & second
  end

  test "per_page is clamped so a caller cannot ask for the whole table again" do
    get "/api/admin/waitlist_signups", params: { per_page: 100_000 }, headers: @auth

    assert_equal Paginated::MAX_PER_PAGE, json["meta"]["per_page"]
  end

  test "a nonsensical page falls back to the first rather than erroring" do
    get "/api/admin/waitlist_signups", params: { page: -3 }, headers: @auth

    assert_response :success
    assert_equal 1, json["meta"]["page"]
  end
end

class Api::Admin::PaymentsFilteringTest < ActionDispatch::IntegrationTest
  setup do
    @auth = { "Authorization" => "Basic #{Base64.strict_encode64('admin:admin')}" }
    @payment = payments(:succeeded_job) # owner_amy / sitter sam
  end

  def json = JSON.parse(response.body)

  test "stats are computed across every payment, not just the page" do
    get "/api/admin/payments", headers: @auth

    assert_response :success
    assert_equal Payment.where(status: "succeeded").sum(:amount).to_f, json["stats"]["volume"]
    assert_equal Payment.count, json["stats"]["total"]
  end

  test "searching matches the owner's name" do
    get "/api/admin/payments", params: { q: @payment.bid.owner.name }, headers: @auth

    assert_equal 1, json["meta"]["total_count"]
  end

  test "searching matches the sitter's name" do
    get "/api/admin/payments", params: { q: @payment.bid.sitter.name }, headers: @auth

    assert_equal 1, json["meta"]["total_count"]
  end

  test "a search that matches nobody returns nothing rather than everything" do
    get "/api/admin/payments", params: { q: "no-such-person" }, headers: @auth

    assert_equal 0, json["meta"]["total_count"]
    assert_empty json["payments"]
  end

  test "a LIKE wildcard in the query is treated as a literal" do
    get "/api/admin/payments", params: { q: "%" }, headers: @auth

    assert_equal 0, json["meta"]["total_count"], "a bare % must not match every row"
  end

  test "filtering by status narrows the set" do
    get "/api/admin/payments", params: { status: "failed" }, headers: @auth

    assert_equal 0, json["meta"]["total_count"]
  end

  test "an unrecognized status is ignored rather than returning nothing" do
    get "/api/admin/payments", params: { status: "bogus" }, headers: @auth

    assert_equal Payment.count, json["meta"]["total_count"]
  end
end
