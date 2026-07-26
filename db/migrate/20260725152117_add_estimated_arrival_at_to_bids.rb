class AddEstimatedArrivalAtToBids < ActiveRecord::Migration[8.1]
  def change
    add_column :bids, :estimated_arrival_at, :datetime
  end
end
