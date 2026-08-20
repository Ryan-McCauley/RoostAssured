require "test_helper"

class SitterApplicationTest < ActiveSupport::TestCase
  setup { @application = sitter_applications(:pending_jordan) }

  test "background_check_cleared? is true only once Checkr reports clear" do
    assert_not @application.background_check_cleared?

    @application.background_check_status = "clear"
    assert @application.background_check_cleared?
  end

  test "background_check_pending? covers invited and pending states" do
    %w[invited pending].each do |status|
      @application.background_check_status = status
      assert @application.background_check_pending?, "expected #{status} to be pending"
    end

    @application.background_check_status = "clear"
    assert_not @application.background_check_pending?
  end

  test "background_check_flagged? covers consider, suspended, and dispute" do
    %w[consider suspended dispute].each do |status|
      @application.background_check_status = status
      assert @application.background_check_flagged?, "expected #{status} to be flagged"
    end

    @application.background_check_status = "clear"
    assert_not @application.background_check_flagged?
  end
end
