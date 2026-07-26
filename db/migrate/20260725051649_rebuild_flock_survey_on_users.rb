class RebuildFlockSurveyOnUsers < ActiveRecord::Migration[8.1]
  def change
    remove_column :users, :flock_size_range, :string
    remove_column :users, :coop_type, :string
    remove_column :users, :visit_frequency, :string
    remove_column :users, :predator_pressure, :string
    remove_column :users, :sitting_start_date, :date
    remove_column :users, :sitting_end_date, :date

    add_column :users, :flock_size_tier, :string
    add_column :users, :coop_features, :string, array: true, default: [], null: false
    add_column :users, :sitting_type, :string
    add_column :users, :other_care_task, :string
    add_column :users, :feed_location, :string
    add_column :users, :water_location, :string
    add_column :users, :phone_number, :string
    add_column :users, :address, :string
    add_column :users, :sitting_dates, :date, array: true, default: [], null: false
  end
end
