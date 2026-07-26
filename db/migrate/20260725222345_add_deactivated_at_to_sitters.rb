class AddDeactivatedAtToSitters < ActiveRecord::Migration[8.1]
  def change
    add_column :sitters, :deactivated_at, :datetime
    add_index :sitters, :deactivated_at
  end
end
