require "test_helper"

class ReportTest < ActiveSupport::TestCase
  test "prevents reporting yourself" do
    owner = users(:owner_amy)
    report = Report.new(reporter: owner, reported_user: owner, reason: "other")

    assert_not report.valid?
    assert_includes report.errors[:reported_user_id], "can't be yourself"
  end

  test "requires a recognized reason" do
    report = Report.new(reporter: users(:owner_amy), reported_user: users(:sitter_sam_user), reason: "made_up")

    assert_not report.valid?
    assert_includes report.errors[:reason], "is not included in the list"
  end

  test "defaults to pending status" do
    report = Report.create!(reporter: users(:owner_amy), reported_user: users(:sitter_sam_user), reason: "spam")

    assert_equal "pending", report.status
  end
end
