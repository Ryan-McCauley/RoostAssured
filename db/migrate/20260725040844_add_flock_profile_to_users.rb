class AddFlockProfileToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :flock_size_range, :string
    add_column :users, :coop_type, :string
    add_column :users, :visit_frequency, :string
    add_column :users, :feeder_count, :integer
    add_column :users, :waterer_count, :integer
    add_column :users, :predator_pressure, :string
    add_column :users, :care_tasks, :string, array: true, default: [], null: false
    add_column :users, :special_requests, :text
  end
end
