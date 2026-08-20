require "test_helper"

class Api::AuthenticationTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:owner_amy)
  end

  def sign_in
    post "/api/session", params: { email_address: @owner.email_address, password: "password123" }, as: :json
    assert_response :success
  end

  test "a session past the inactivity timeout no longer authenticates" do
    sign_in
    get "/api/account", as: :json
    assert_response :success

    travel (Session::INACTIVITY_TIMEOUT + 1.day) do
      get "/api/account", as: :json
      assert_response :unauthorized
    end
  end

  test "a session past the absolute timeout no longer authenticates even when kept active" do
    sign_in
    session = Session.last

    travel (Session::ABSOLUTE_TIMEOUT + 1.day) do
      session.touch # still "active", but too old to keep

      get "/api/account", as: :json
      assert_response :unauthorized
    end
  end

  test "an expired session record is cleaned up on use" do
    sign_in

    travel (Session::INACTIVITY_TIMEOUT + 1.day) do
      assert_difference -> { Session.count }, -1 do
        get "/api/account", as: :json
      end
    end
  end

  test "a live session keeps working and records activity" do
    sign_in
    session = Session.last
    original_touched_at = session.updated_at

    travel 2.hours do
      get "/api/account", as: :json
      assert_response :success
    end

    assert_operator session.reload.updated_at, :>, original_touched_at
  end
end
