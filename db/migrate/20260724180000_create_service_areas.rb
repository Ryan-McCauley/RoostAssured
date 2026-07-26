class CreateServiceAreas < ActiveRecord::Migration[8.1]
  def change
    create_table :service_areas do |t|
      t.string :zip_code, null: false

      t.timestamps
    end

    add_index :service_areas, :zip_code, unique: true
  end
end
