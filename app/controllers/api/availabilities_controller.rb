class Api::AvailabilitiesController < ApplicationController
  before_action :require_sitter_profile

  def create
    availability = current_user.sitter.availabilities.new(availability_params)

    if availability.save
      render json: { availabilities: current_user.sitter.availabilities.order(:start_date).as_json }
    else
      render_errors(availability)
    end
  end

  def destroy
    current_user.sitter.availabilities.find(params[:id]).destroy
    render json: { availabilities: current_user.sitter.availabilities.order(:start_date).as_json }
  end

  private

  def require_sitter_profile
    render json: { errors: [ "You need a sitter profile first." ] }, status: :unprocessable_entity unless current_user.sitter
  end

  def availability_params
    params.require(:availability).permit(:start_date, :end_date)
  end
end
