class ReplaceOvernightWithTravelRadiusOnUsers < ActiveRecord::Migration[8.1]
  def change
    remove_column :users, :offers_overnight, :boolean, default: false, null: false
    add_column :users, :travel_radius_miles, :integer, default: 10, null: false
  end
end
