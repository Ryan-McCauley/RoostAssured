class AddApplicationDetailsToSitterApplications < ActiveRecord::Migration[8.1]
  def change
    add_column :sitter_applications, :first_name, :string
    add_column :sitter_applications, :middle_name, :string
    add_column :sitter_applications, :last_name, :string
    add_column :sitter_applications, :street_address, :string
    add_column :sitter_applications, :city, :string
    add_column :sitter_applications, :state, :string
    add_column :sitter_applications, :zip_code, :string
    add_column :sitter_applications, :availability_days, :string, array: true, default: [], null: false
    add_column :sitter_applications, :availability_times, :string, array: true, default: [], null: false
  end
end
