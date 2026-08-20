require "test_helper"

class Api::MessagesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @bid = bids(:accepted_job)
    @owner = users(:owner_amy)
    @sitter_user = users(:sitter_sam_user)
  end

  test "allows messaging when neither party has blocked the other" do
    sign_in(@owner)

    post "/api/bids/#{@bid.id}/messages", params: { body: "Hello!" }, as: :json

    assert_response :success
  end

  test "forbids messaging once either party has blocked the other" do
    Block.create!(blocker: @sitter_user, blocked_user: @owner)
    sign_in(@owner)

    post "/api/bids/#{@bid.id}/messages", params: { body: "Hello?" }, as: :json

    assert_response :forbidden
  end

  private

  def sign_in(user)
    post "/api/session", params: { email_address: user.email_address, password: "password123" }, as: :json
    assert_response :success
  end
end
