class CreateWaitlistSignups < ActiveRecord::Migration[8.1]
  def change
    create_table :waitlist_signups do |t|
      t.string :email
      t.string :zip_code
      t.string :role

      t.timestamps
    end

    add_index :waitlist_signups, :email, unique: true
  end
end
