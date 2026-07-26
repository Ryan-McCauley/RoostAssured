class Api::Admin::JobsController < Api::AdminController
  def index
    jobs = Bid.where(status: "accepted").includes(:sitter, :owner, :job_tasks).order(created_at: :desc)
    render json: { jobs: jobs.map(&:as_admin_json) }
  end
end
