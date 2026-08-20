require "test_helper"

class Api::BlocksControllerTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:owner_amy)
    @sitter_user = users(:sitter_sam_user)
    post "/api/session", params: { email_address: @owner.email_address, password: "password123" }, as: :json
    assert_response :success
  end

  test "creates a block" do
    post "/api/blocks", params: { blocked_user_id: @sitter_user.id }, as: :json

    assert_response :success
    assert @owner.blocked?(@sitter_user)
  end

  test "rejects blocking yourself" do
    post "/api/blocks", params: { blocked_user_id: @owner.id }, as: :json

    assert_response :unprocessable_entity
  end

  test "destroy removes the block" do
    Block.create!(blocker: @owner, blocked_user: @sitter_user)

    delete "/api/blocks/#{@sitter_user.id}", as: :json

    assert_response :success
    assert_not @owner.reload.blocked?(@sitter_user)
  end

  test "index lists blocked users" do
    Block.create!(blocker: @owner, blocked_user: @sitter_user)

    get "/api/blocks", as: :json

    assert_response :success
    ids = JSON.parse(response.body)["blocked_users"].map { |b| b["id"] }
    assert_includes ids, @sitter_user.id
  end
end
