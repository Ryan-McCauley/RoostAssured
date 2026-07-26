class Api::JobTasksController < ApplicationController
  before_action :require_sitter
  before_action :set_job
  before_action :set_task

  def update
    if @task.update(completed: ActiveModel::Type::Boolean.new.cast(params[:completed]))
      @job.broadcast_job_update
      render json: { job: @job.reload.as_json_public }
    else
      render_errors(@task)
    end
  end

  def photo
    @task.photo.attach(params[:photo])
    if @task.save
      @job.broadcast_job_update
      render json: { job: @job.reload.as_json_public }
    else
      render_errors(@task)
    end
  end

  private

  def require_sitter
    @sitter = current_user.sitter
    render json: { errors: [ "You need an approved sitter profile to manage jobs." ] }, status: :forbidden unless @sitter
  end

  def set_job
    @job = @sitter.bids.where(status: "accepted").find(params[:job_id])
  end

  def set_task
    @task = @job.job_tasks.find(params[:id])
  end
end
