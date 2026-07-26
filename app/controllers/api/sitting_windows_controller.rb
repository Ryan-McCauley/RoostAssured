class Api::SittingWindowsController < ApplicationController
  allow_unauthenticated_access

  def create
    session[:sitting_start_date] = params[:sitting_start_date].presence
    session[:sitting_end_date] = params[:sitting_end_date].presence
    session[:sitting_window_asked] = true
    head :no_content
  end
end
