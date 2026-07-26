class Api::SitterProfilesController < ApplicationController
  # Editing an existing, already-approved sitter listing. Sitter records are only
  # ever created by admin approval of a SitterApplication — never from here.
  def update
    sitter = current_user.sitter
    return render json: { errors: [ "You don't have an approved sitter profile yet." ] }, status: :forbidden unless sitter

    if sitter.update(sitter_params)
      render json: { user: current_user.as_json_public }
    else
      render_errors(sitter)
    end
  end

  private

  def sitter_params
    params.require(:sitter).permit(:bio, :price_per_visit, :years_experience, :own_flock,
                                    :travel_radius_miles, :background_check_consent, :profile_photo)
  end
end
