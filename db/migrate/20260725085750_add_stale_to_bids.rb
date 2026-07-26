class AddStaleToBids < ActiveRecord::Migration[8.1]
  def change
    add_column :bids, :stale, :boolean, default: false, null: false
  end
end
