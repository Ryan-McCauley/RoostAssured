class Api::Admin::UsersController < Api::AdminController
  def index
    users = User.left_joins(:sitter).includes(:sitter_application, sitter: [ :user, :bids ]).order(zip_code: :asc, created_at: :desc)
    users = users.where(zip_code: params[:zip_code]) if params[:zip_code].present?
    users = users.where.not(sitters: { id: nil }) if params[:sitter] == "true"
    render json: { users: paginate(users).map(&:as_json_public), meta: pagination_meta(users) }
  end
end
