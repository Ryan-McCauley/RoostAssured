class AddCheckrFieldsToSitters < ActiveRecord::Migration[8.1]
  def change
    add_column :sitters, :background_check_status, :string, default: "not_started", null: false
    add_column :sitters, :checkr_candidate_id, :string
    add_column :sitters, :checkr_invitation_id, :string
    add_column :sitters, :checkr_report_id, :string
  end
end
