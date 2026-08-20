module Checkr
  class InvitationService
    # Creates a Checkr candidate + invitation for a sitter applicant, once their application fee has
    # cleared. The candidate completes the check (SSN, DOB, consent) entirely on Checkr's hosted
    # portal — we never collect or store that information ourselves.
    def create_invitation!(sitter_application)
      return if sitter_application.checkr_invitation_id.present?
      return unless CheckrConfig.configured?

      client = Client.new
      first_name = sitter_application.first_name
      last_name = sitter_application.last_name

      candidate = client.post("candidates", {
        email: sitter_application.email_address,
        first_name: first_name,
        last_name: last_name,
        zipcode: sitter_application.zip_code
      })

      invitation = client.post("invitations", {
        candidate_id: candidate["id"],
        package: CheckrConfig::PACKAGE
      })

      sitter_application.update!(
        checkr_candidate_id: candidate["id"],
        checkr_invitation_id: invitation["id"],
        background_check_status: "invited"
      )
    end
  end
end
