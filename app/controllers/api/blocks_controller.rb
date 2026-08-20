class Api::BlocksController < ApplicationController
  def index
    blocks = current_user.blocks_initiated.includes(:blocked_user).order(created_at: :desc)
    render json: {
      blocked_users: blocks.map { |b| { id: b.blocked_user_id, name: b.blocked_user.name, blocked_at: b.created_at } }
    }
  end

  def create
    other_user = User.find(params[:blocked_user_id])
    block = current_user.blocks_initiated.build(blocked_user: other_user)
    if block.save
      render json: { blocked_user_id: other_user.id }
    else
      render_errors(block)
    end
  end

  def destroy
    current_user.blocks_initiated.find_by(blocked_user_id: params[:id])&.destroy
    render json: { blocked_user_id: params[:id].to_i }
  end
end
