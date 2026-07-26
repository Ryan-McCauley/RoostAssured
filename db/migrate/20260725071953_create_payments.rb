class CreatePayments < ActiveRecord::Migration[8.1]
  def change
    create_table :payments do |t|
      t.references :bid, null: false, foreign_key: true
      t.string :stripe_payment_intent_id, null: false
      t.string :status, default: "pending", null: false
      t.decimal :amount, precision: 8, scale: 2, null: false
      t.decimal :application_fee_amount, precision: 8, scale: 2, null: false
      t.date :accepted_dates, array: true, default: [], null: false

      t.timestamps
    end
    add_index :payments, :stripe_payment_intent_id, unique: true
  end
end
