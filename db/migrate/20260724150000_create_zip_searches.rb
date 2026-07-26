class CreateZipSearches < ActiveRecord::Migration[8.1]
  def change
    create_table :zip_searches do |t|
      t.string :zip_code, null: false

      t.timestamps
    end

    add_index :zip_searches, :zip_code
  end
end
