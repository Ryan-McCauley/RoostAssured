class AddProfileToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :name, :string, null: false, default: ""
    add_column :users, :role, :string
    add_column :users, :zip_code, :string
    add_column :users, :bio, :text
  end
end
