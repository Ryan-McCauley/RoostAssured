require "test_helper"

class UserPasswordTest < ActiveSupport::TestCase
  test "rejects a password shorter than the minimum" do
    user = User.new(name: "Short", email_address: "short@example.com", password: "abc123")

    assert_not user.valid?
    assert_includes user.errors[:password].join, "too short"
  end

  test "accepts a password at the minimum length" do
    user = User.new(name: "Fine", email_address: "fine@example.com", password: "a" * User::MINIMUM_PASSWORD_LENGTH)

    assert user.valid?, user.errors.full_messages.to_sentence
  end

  test "the length rule also applies to password resets" do
    user = users(:owner_amy)

    assert_not user.update(password: "short")
    assert_includes user.errors[:password].join, "too short"
  end

  test "updates that do not touch the password are unaffected" do
    user = users(:owner_amy)

    assert user.update(name: "Renamed"), user.errors.full_messages.to_sentence
  end
end
