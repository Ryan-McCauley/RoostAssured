class AddSittingDatesToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :sitting_start_date, :date
    add_column :users, :sitting_end_date, :date
  end
end
