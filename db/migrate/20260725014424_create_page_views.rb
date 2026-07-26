class CreatePageViews < ActiveRecord::Migration[8.1]
  def change
    create_table :page_views do |t|
      t.string :ip_address
      t.string :path
      t.references :user, foreign_key: true, null: true
      t.decimal :latitude, precision: 9, scale: 6
      t.decimal :longitude, precision: 9, scale: 6
      t.string :city
      t.string :region
      t.timestamps
    end
  end
end
