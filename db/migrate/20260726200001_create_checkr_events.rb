class CreateCheckrEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :checkr_events do |t|
      t.string :checkr_event_id, null: false
      t.timestamps
    end
    add_index :checkr_events, :checkr_event_id, unique: true
  end
end
