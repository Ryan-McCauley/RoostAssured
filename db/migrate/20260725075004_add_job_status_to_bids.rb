class AddJobStatusToBids < ActiveRecord::Migration[8.1]
  def change
    add_column :bids, :job_status, :string, default: "not_started", null: false
  end
end
