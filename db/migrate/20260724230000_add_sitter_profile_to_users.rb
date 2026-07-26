class AddSitterProfileToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :price_per_visit, :decimal, precision: 6, scale: 2
    add_column :users, :years_experience, :integer
    add_column :users, :own_flock, :boolean, default: false, null: false
    add_column :users, :offers_overnight, :boolean, default: false, null: false
    add_column :users, :background_check_consent, :boolean, default: false, null: false
  end
end
