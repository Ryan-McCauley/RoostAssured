class Api::ReportsController < ApplicationController
  rate_limit to: 10, within: 1.hour, only: [ :create ], by: -> { current_user.id },
             with: -> { render json: { errors: [ "You're doing that too much — please slow down and try again in a bit." ] }, status: :too_many_requests }

  def create
    reported_user = User.find(params[:reported_user_id])
    report = current_user.reports_filed.build(
      reported_user: reported_user, bid_id: params[:bid_id].presence, reason: params[:reason], details: params[:details]
    )
    if report.save
      render json: { report: report.as_json_public }
    else
      render_errors(report)
    end
  end
end
