class AddCityAndStateToZipSearchesAndWaitlistSignups < ActiveRecord::Migration[8.1]
  def change
    add_column :zip_searches, :city, :string
    add_column :zip_searches, :state, :string

    add_column :waitlist_signups, :city, :string
    add_column :waitlist_signups, :state, :string
  end
end
