class DecoupleSittersFromUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :sitters do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.text :bio
      t.decimal :price_per_visit, precision: 6, scale: 2
      t.integer :years_experience
      t.boolean :own_flock, default: false, null: false
      t.integer :travel_radius_miles, default: 10, null: false
      t.boolean :background_check_consent, default: false, null: false

      t.timestamps
    end

    remove_reference :availabilities, :user, foreign_key: true, index: true
    add_reference :availabilities, :sitter, null: false, foreign_key: true, index: true

    remove_column :users, :role, :string
    remove_column :users, :bio, :text
    remove_column :users, :price_per_visit, :decimal, precision: 6, scale: 2
    remove_column :users, :years_experience, :integer
    remove_column :users, :own_flock, :boolean, default: false, null: false
    remove_column :users, :travel_radius_miles, :integer, default: 10, null: false
    remove_column :users, :background_check_consent, :boolean, default: false, null: false
  end
end
