class Api::SittersController < ApplicationController
  allow_unauthenticated_access only: %i[ show ]

  def show
    sitter = Sitter.find(params[:id])
    availabilities = sitter.availabilities.where("end_date >= ?", Date.current).order(:start_date)
    render json: { sitter: sitter.as_json_public, availabilities: availabilities.as_json }
  end
end
