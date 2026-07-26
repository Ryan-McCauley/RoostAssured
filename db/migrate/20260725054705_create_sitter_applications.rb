class CreateSitterApplications < ActiveRecord::Migration[8.1]
  def change
    create_table :sitter_applications do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.text :bio
      t.decimal :price_per_visit, precision: 6, scale: 2
      t.integer :years_experience
      t.boolean :own_flock, default: false, null: false
      t.integer :travel_radius_miles, default: 10, null: false
      t.boolean :background_check_consent, default: false, null: false
      t.string :status, default: "pending", null: false
      t.datetime :reviewed_at

      t.timestamps
    end
  end
end
