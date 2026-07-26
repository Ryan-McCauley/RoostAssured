class Message < ApplicationRecord
  belongs_to :bid
  belongs_to :sender, class_name: "User"

  validates :body, presence: true, length: { maximum: 2000 }

  def as_json_for(current_user)
    {
      id: id, body: body, sender_id: sender_id, sender_name: sender.name,
      mine: sender_id == current_user.id, created_at: created_at
    }
  end
end
