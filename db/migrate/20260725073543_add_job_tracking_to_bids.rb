class AddJobTrackingToBids < ActiveRecord::Migration[8.1]
  def change
    add_column :bids, :on_the_way_at, :datetime
    add_column :bids, :rating, :integer
    add_column :bids, :review, :text
  end
end
