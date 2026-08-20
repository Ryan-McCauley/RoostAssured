require "test_helper"

class BidTest < ActiveSupport::TestCase
  setup { @bid = bids(:accepted_job) }

  test "cannot be marked completed while checklist items remain undone" do
    @bid.job_tasks.create!(description: "Feed & water", position: 0, completed: false)

    @bid.job_status = "completed"

    assert_not @bid.valid?
    assert_includes @bid.errors[:job_status], "can't be set to completed until every checklist item is marked done"
  end

  test "cannot be marked completed without at least one photo" do
    @bid.job_tasks.create!(description: "Feed & water", position: 0, completed: true)

    @bid.job_status = "completed"

    assert_not @bid.valid?
    assert_includes @bid.errors[:job_status], "requires at least one photo before it can be marked completed"
  end

  test "rating must be between 1 and 5" do
    @bid.rating = 6
    assert_not @bid.valid?

    @bid.rating = 0
    assert_not @bid.valid?

    @bid.rating = 5
    assert @bid.valid?
  end

  test "rejects overlapping accepted and declined dates" do
    @bid.accepted_dates = [ "2026-08-01" ]
    @bid.declined_dates = [ "2026-08-01" ]

    assert_not @bid.valid?
    assert_includes @bid.errors[:base], "can't accept and decline the same date"
  end
end
