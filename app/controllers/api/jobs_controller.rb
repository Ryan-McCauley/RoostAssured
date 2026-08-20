class Api::JobsController < ApplicationController
  before_action :require_sitter
  before_action :set_job, only: [ :update_status, :update_notes, :update_eta ]

  def index
    jobs = @sitter.bids.where(status: "accepted").order(created_at: :desc)
    render json: { jobs: jobs.map(&:as_json_public) }
  end

  def update_status
    new_status = params[:job_status]
    return render json: { errors: [ "Not a recognized job status." ] }, status: :unprocessable_entity unless Bid::JOB_STATUSES.include?(new_status)

    send_on_the_way_email = new_status == "on_the_way" && @job.on_the_way_at.blank?
    attrs = { job_status: new_status }
    attrs[:estimated_arrival_at] = parsed_eta if new_status == "on_the_way" && params.key?(:estimated_arrival_at)
    # Folded into the same update rather than a follow-up update_column, which skipped validation
    # and left updated_at stale.
    attrs[:on_the_way_at] = Time.current if send_on_the_way_email

    if @job.update(attrs)
      if send_on_the_way_email
        BidMailer.on_the_way(@job).deliver_later
      end
      render json: { job: @job.as_json_public }
    else
      render_errors(@job)
    end
  end

  def update_notes
    if @job.update(sitter_notes: params[:sitter_notes])
      @job.broadcast_job_update
      render json: { job: @job.as_json_public }
    else
      render_errors(@job)
    end
  end

  def update_eta
    if @job.update(estimated_arrival_at: parsed_eta)
      @job.broadcast_job_update
      render json: { job: @job.as_json_public }
    else
      render_errors(@job)
    end
  end

  private

  def require_sitter
    @sitter = current_user.sitter
    render json: { errors: [ "You need an approved sitter profile to manage jobs." ] }, status: :forbidden unless @sitter
  end

  def set_job
    @job = @sitter.bids.where(status: "accepted").find(params[:id])
  end

  def parsed_eta
    params[:estimated_arrival_at].presence
  end
end
