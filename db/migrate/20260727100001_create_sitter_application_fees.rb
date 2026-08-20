class CreateSitterApplicationFees < ActiveRecord::Migration[8.1]
  def change
    create_table :sitter_application_fees do |t|
      t.references :user, null: false, foreign_key: true
      t.references :sitter_application, null: true, foreign_key: true
      t.string :stripe_payment_intent_id, null: false
      t.decimal :amount, precision: 6, scale: 2, null: false, default: "50.0"
      t.string :status, null: false, default: "pending"
      t.timestamps
    end
    add_index :sitter_application_fees, :stripe_payment_intent_id, unique: true
  end
end
