require "test_helper"

class UserSittingRequestEmailsTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper
  include ActionMailer::TestHelper

  setup do
    @owner = users(:owner_amy)
    @owner.update_columns(
      zip_code: "78701", city: "Austin", state: "TX", latitude: 30.2672, longitude: -97.7431,
      phone_number: "5551234567", address: "123 Main St"
    )

    @sitter = sitters(:sam)
    @sitter.user.update_columns(zip_code: "78701", city: "Austin", state: "TX", latitude: 30.27, longitude: -97.74)
    @sitter.update!(travel_radius_miles: 25)
  end

  test "posting a new request emails the owner a receipt and alerts nearby sitters" do
    assert_enqueued_emails 2 do
      @owner.update!(sitting_dates: [ Date.tomorrow ])
    end
  end

  test "editing an already-posted request does not re-send the new-request emails" do
    @owner.update!(sitting_dates: [ Date.tomorrow ])

    assert_no_enqueued_emails do
      @owner.update!(sitting_dates: [ Date.tomorrow, 2.days.from_now.to_date ])
    end
  end

  test "a blocked sitter is not alerted" do
    Block.create!(blocker: @owner, blocked_user: @sitter.user)

    assert_enqueued_emails 1 do
      @owner.update!(sitting_dates: [ Date.tomorrow ])
    end
  end

  test "a sitter outside the travel radius is not alerted" do
    @sitter.update!(travel_radius_miles: 5)
    @sitter.user.update_columns(latitude: 40.7128, longitude: -74.0060) # New York — far from Austin

    assert_enqueued_emails 1 do
      @owner.update!(sitting_dates: [ Date.tomorrow ])
    end
  end
end
