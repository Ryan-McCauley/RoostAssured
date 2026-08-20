require "test_helper"

class Checkr::InvitationServiceTest < ActiveSupport::TestCase
  setup do
    @application = sitter_applications(:pending_jordan)
    @original_key = ENV["CHECKR_API_KEY"]
    ENV["CHECKR_API_KEY"] = "test_key"
  end

  teardown { ENV["CHECKR_API_KEY"] = @original_key }

  test "creates a candidate and invitation, then records the ids and status" do
    responses = { "candidates" => { "id" => "cand_123" }, "invitations" => { "id" => "inv_456" } }

    with_stubbed_checkr_post(responses) do
      Checkr::InvitationService.new.create_invitation!(@application)
    end

    assert_equal "cand_123", @application.reload.checkr_candidate_id
    assert_equal "inv_456", @application.checkr_invitation_id
    assert_equal "invited", @application.background_check_status
  end

  test "does nothing if an invitation already exists" do
    @application.update!(checkr_invitation_id: "inv_existing")

    Checkr::InvitationService.new.create_invitation!(@application)

    assert_equal "not_started", @application.reload.background_check_status
  end

  test "does nothing if Checkr isn't configured" do
    ENV["CHECKR_API_KEY"] = nil

    Checkr::InvitationService.new.create_invitation!(@application)

    assert_nil @application.reload.checkr_invitation_id
  end

  private

  # Checkr::Client#post is defined on the class itself, so a bare remove_method would delete the
  # real implementation instead of restoring it -- and every later test in this worker that hits
  # the client would then die with NoMethodError. with_instance_method puts the original back.
  def with_stubbed_checkr_post(responses, &block)
    with_instance_method(Checkr::Client, :post, ->(path, _body) { responses.fetch(path) }, &block)
  end
end
