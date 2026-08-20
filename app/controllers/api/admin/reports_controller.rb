class Api::Admin::ReportsController < Api::AdminController
  def index
    reports = Report.includes(:reporter, :reported_user).order(Arel.sql("status = 'pending' DESC"), created_at: :desc)
    render json: { reports: reports.map(&:as_json_public) }
  end

  def review
    report = Report.find(params[:id])
    report.update!(status: "reviewed")
    render json: { report: report.as_json_public }
  end

  def dismiss
    report = Report.find(params[:id])
    report.update!(status: "dismissed")
    render json: { report: report.as_json_public }
  end
end
