class CreateJobTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :job_tasks do |t|
      t.references :bid, null: false, foreign_key: true
      t.string :description, null: false
      t.boolean :completed, default: false, null: false
      t.integer :position, default: 0, null: false

      t.timestamps
    end
  end
end
