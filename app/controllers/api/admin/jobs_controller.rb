class Api::Admin::JobsController < Api::AdminController
  def index
    jobs = Bid.where(status: "accepted").includes(:owner, :job_tasks, sitter: [ :user, :bids ]).order(created_at: :desc)

    render json: {
      jobs: paginate(jobs).map(&:as_admin_json),
      meta: pagination_meta(jobs),
      stats: stats
    }
  end

  private

  # Aggregated across every accepted job, not just the page on screen -- the dashboard used to
  # derive these in JavaScript from an unbounded list.
  def stats
    accepted = Bid.where(status: "accepted")
    rated = accepted.where.not(rating: nil)
    average = rated.average(:rating)

    {
      active_count: accepted.where.not(job_status: "completed").count,
      completed_count: accepted.where(job_status: "completed").count,
      rated_count: rated.count,
      average_rating: average&.to_f&.round(1),
      flagged_count: accepted.where(stale: true).count
    }
  end
end
