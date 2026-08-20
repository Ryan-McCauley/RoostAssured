class Api::Admin::SittersController < Api::AdminController
  def index
    sitters = Sitter.includes(:user, :bids, profile_photo_attachment: :blob).order(created_at: :desc)
    render json: { sitters: paginate(sitters).map(&:as_admin_json), meta: pagination_meta(sitters) }
  end

  def deactivate
    sitter = Sitter.find(params[:id])
    sitter.deactivate!
    render json: { sitter: sitter.as_admin_json }
  end

  def reactivate
    sitter = Sitter.find(params[:id])
    sitter.reactivate!
    render json: { sitter: sitter.as_admin_json }
  end
end
