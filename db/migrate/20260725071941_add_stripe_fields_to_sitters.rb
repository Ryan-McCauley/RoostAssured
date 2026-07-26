class AddStripeFieldsToSitters < ActiveRecord::Migration[8.1]
  def change
    add_column :sitters, :stripe_account_id, :string
    add_index :sitters, :stripe_account_id, unique: true
    add_column :sitters, :stripe_onboarding_status, :string, default: "not_started", null: false
    add_column :sitters, :fee_percentage, :decimal, precision: 5, scale: 2, default: 15.00, null: false
  end
end
