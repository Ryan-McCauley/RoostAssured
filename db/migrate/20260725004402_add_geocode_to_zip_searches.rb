class AddGeocodeToZipSearches < ActiveRecord::Migration[8.1]
  def change
    add_column :zip_searches, :latitude, :decimal, precision: 9, scale: 6
    add_column :zip_searches, :longitude, :decimal, precision: 9, scale: 6
  end
end
