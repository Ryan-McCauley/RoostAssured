class MoveCheckrFieldsToSitterApplications < ActiveRecord::Migration[8.1]
  def change
    remove_column :sitters, :background_check_status, :string, default: "not_started", null: false
    remove_column :sitters, :checkr_candidate_id, :string
    remove_column :sitters, :checkr_invitation_id, :string
    remove_column :sitters, :checkr_report_id, :string

    add_column :sitter_applications, :background_check_status, :string, default: "not_started", null: false
    add_column :sitter_applications, :checkr_candidate_id, :string
    add_column :sitter_applications, :checkr_invitation_id, :string
    add_column :sitter_applications, :checkr_report_id, :string
    add_index :sitter_applications, :checkr_candidate_id, unique: true
    add_index :sitter_applications, :checkr_invitation_id, unique: true
  end
end
