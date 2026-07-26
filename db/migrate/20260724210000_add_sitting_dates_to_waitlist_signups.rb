class AddSittingDatesToWaitlistSignups < ActiveRecord::Migration[8.1]
  def change
    add_column :waitlist_signups, :sitting_start_date, :date
    add_column :waitlist_signups, :sitting_end_date, :date
  end
end
