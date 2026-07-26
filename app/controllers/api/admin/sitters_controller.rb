class Api::Admin::SittersController < Api::AdminController
  def index
    render json: { sitters: Sitter.includes(:user).order(created_at: :desc).map(&:as_admin_json) }
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
