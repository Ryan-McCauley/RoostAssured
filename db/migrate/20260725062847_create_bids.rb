class CreateBids < ActiveRecord::Migration[8.1]
  def change
    create_table :bids do |t|
      t.references :sitter, null: false, foreign_key: true
      t.references :owner, null: false, foreign_key: { to_table: :users }
      t.decimal :amount, precision: 6, scale: 2
      t.text :message
      t.date :accepted_dates, array: true, default: [], null: false
      t.date :declined_dates, array: true, default: [], null: false
      t.string :status, default: "submitted", null: false

      t.timestamps
    end

    add_index :bids, [ :sitter_id, :owner_id ], unique: true
  end
end
