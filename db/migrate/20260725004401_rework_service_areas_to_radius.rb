class ReworkServiceAreasToRadius < ActiveRecord::Migration[8.1]
  def change
    remove_index :service_areas, :zip_code, if_exists: true
    remove_column :service_areas, :zip_code, :string

    add_column :service_areas, :name, :string, null: false, default: ""
    add_column :service_areas, :latitude, :decimal, precision: 9, scale: 6, null: false
    add_column :service_areas, :longitude, :decimal, precision: 9, scale: 6, null: false
    add_column :service_areas, :radius_miles, :integer, null: false, default: 10
  end
end
