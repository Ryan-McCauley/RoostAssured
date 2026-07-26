class AddUniqueIndexToServiceAreasName < ActiveRecord::Migration[8.1]
  def change
    add_index :service_areas, "lower(name)", unique: true, name: "index_service_areas_on_lower_name"
  end
end
