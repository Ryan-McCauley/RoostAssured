require "test_helper"

class Api::ReceivedBidsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @owner = users(:owner_amy)
    @bid = bids(:accepted_job)
    post "/api/session", params: { email_address: @owner.email_address, password: "password123" }, as: :json
    assert_response :success
  end

  test "rejects rating before the job is marked completed" do
    assert_equal "in_progress", @bid.job_status

    post "/api/bids/#{@bid.id}/rate", params: { bid: { rating: 5, review: "Great!" } }, as: :json

    assert_response :unprocessable_entity
    assert_nil @bid.reload.rating
    assert_includes JSON.parse(response.body)["errors"].join, "marked completed"
  end

  test "allows rating once the job is completed" do
    @bid.job_tasks.create!(description: "Feed & water", position: 0, completed: true, photo: fixture_file_photo)
    @bid.update!(job_status: "completed")

    post "/api/bids/#{@bid.id}/rate", params: { bid: { rating: 5, review: "Great!" } }, as: :json

    assert_response :success
    assert_equal 5, @bid.reload.rating
  end

  private

  def fixture_file_photo
    Rack::Test::UploadedFile.new(Rails.root.join("test/fixtures/files/task_photo.jpg"), "image/jpeg")
  end
end
