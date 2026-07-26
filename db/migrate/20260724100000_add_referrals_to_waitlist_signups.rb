class AddReferralsToWaitlistSignups < ActiveRecord::Migration[8.1]
  def change
    add_column :waitlist_signups, :referral_code, :string
    add_column :waitlist_signups, :referred_by_id, :bigint
    add_column :waitlist_signups, :referrals_count, :integer, null: false, default: 0

    add_index :waitlist_signups, :referral_code, unique: true
    add_index :waitlist_signups, :referred_by_id
    add_foreign_key :waitlist_signups, :waitlist_signups, column: :referred_by_id
  end
end
