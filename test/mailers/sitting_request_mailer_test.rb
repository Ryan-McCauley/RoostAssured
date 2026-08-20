require "test_helper"

class SittingRequestMailerTest < ActionMailer::TestCase
  test "receipt is addressed to the owner and includes the dates" do
    owner = users(:owner_amy)
    owner.update_columns(sitting_dates: [ Date.tomorrow ], city: "Austin", state: "TX")

    mail = SittingRequestMailer.receipt(owner)

    assert_equal [ owner.email_address ], mail.to
    assert_match "chicken sitting request", mail.subject
    assert_match Date.tomorrow.strftime("%b %-d"), mail.html_part.body.to_s
  end

  test "new_request_alert is addressed to the sitter and names the owner's city" do
    sitter = sitters(:sam)
    owner = users(:owner_amy)
    owner.update_columns(sitting_dates: [ Date.tomorrow ], city: "Austin", state: "TX")

    mail = SittingRequestMailer.new_request_alert(sitter, owner)

    assert_equal [ sitter.email_address ], mail.to
    assert_match "Austin", mail.subject
    assert_match owner.name, mail.html_part.body.to_s
  end
end
