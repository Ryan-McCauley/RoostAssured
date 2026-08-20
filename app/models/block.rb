class Block < ApplicationRecord
  belongs_to :blocker, class_name: "User"
  belongs_to :blocked_user, class_name: "User"

  validates :blocked_user_id, uniqueness: { scope: :blocker_id }
  validate :cannot_block_self

  private

  def cannot_block_self
    errors.add(:blocked_user_id, "can't be yourself") if blocker_id.present? && blocker_id == blocked_user_id
  end
end
