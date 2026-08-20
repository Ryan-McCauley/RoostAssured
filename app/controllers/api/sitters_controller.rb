class Api::SittersController < ApplicationController
  allow_unauthenticated_access only: %i[ show ]

  def show
    # Scoped to active sitters: this endpoint is unauthenticated, so without the filter a sitter
    # deactivated for cause keeps a live public profile that still accepts traffic.
    sitter = Sitter.where(deactivated_at: nil).find(params[:id])
    availabilities = sitter.availabilities.where("end_date >= ?", Date.current).order(:start_date)
    render json: { sitter: sitter.as_json_public, availabilities: availabilities.as_json }
  end
end
