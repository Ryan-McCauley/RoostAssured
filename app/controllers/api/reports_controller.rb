class Api::ReportsController < ApplicationController
  rate_limit to: 10, within: 1.hour, only: [ :create ], by: -> { current_user.id },
             with: -> { render json: { errors: [ "You're doing that too much — please slow down and try again in a bit." ] }, status: :too_many_requests }

  def create
    reported_user = User.find(params[:reported_user_id])
    report = current_user.reports_filed.build(
      reported_user: reported_user, bid: referenced_bid, reason: params[:reason], details: params[:details]
    )
    if report.save
      render json: { report: report.as_json_public }
    else
      render_errors(report)
    end
  end

  private

  # bid_id came straight off the params, so a report could be filed citing any bid in the system,
  # including ones the reporter was never party to. Only bids they are actually on can be attached.
  def referenced_bid
    return nil if params[:bid_id].blank?

    Bid.where(owner_id: current_user.id)
       .or(Bid.where(sitter_id: current_user.sitter&.id))
       .find_by(id: params[:bid_id])
  end
end
