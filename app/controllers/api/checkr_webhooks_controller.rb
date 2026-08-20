class Api::CheckrWebhooksController < ApplicationController
  allow_unauthenticated_access
  skip_before_action :verify_authenticity_token, raise: false

  REPORT_STATUSES = %w[clear consider suspended dispute].freeze

  def create
    event = verify_event
    return head :bad_request unless event

    return head :ok unless CheckrEvent.create_if_new(event["id"])

    case event["type"]
    when "invitation.completed"
      handle_invitation_completed(event["data"]["object"])
    when "invitation.expired", "invitation.canceled"
      handle_invitation_ended(event["data"]["object"])
    when "report.completed", "report.updated"
      handle_report(event["data"]["object"])
    end

    head :ok
  end

  private

  def verify_event
    payload = request.body.read
    signature = request.headers["X-Checkr-Signature"]
    return nil if signature.blank? || CheckrConfig.webhook_key.blank?

    digest = OpenSSL::HMAC.hexdigest("SHA256", CheckrConfig.webhook_key, payload)
    return nil unless ActiveSupport::SecurityUtils.secure_compare(digest, signature)

    JSON.parse(payload)
  rescue JSON::ParserError => e
    Rails.logger.error("Checkr webhook signature verification failed: #{e.message}")
    nil
  end

  def handle_invitation_completed(invitation)
    application = SitterApplication.find_by(checkr_invitation_id: invitation["id"])
    return unless application

    application.update!(background_check_status: "pending")
  end

  def handle_invitation_ended(invitation)
    application = SitterApplication.find_by(checkr_invitation_id: invitation["id"])
    return unless application

    application.update!(background_check_status: "invitation_expired")
  end

  def handle_report(report)
    application = SitterApplication.find_by(checkr_candidate_id: report["candidate_id"])
    return unless application
    return unless REPORT_STATUSES.include?(report["status"])

    application.update!(checkr_report_id: report["id"], background_check_status: report["status"])
  end
end
