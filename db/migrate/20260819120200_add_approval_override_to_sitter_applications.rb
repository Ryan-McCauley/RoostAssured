class AddApprovalOverrideToSitterApplications < ActiveRecord::Migration[8.1]
  def change
    # Records that an admin approved a sitter whose background check was not clear. Without it the
    # override leaves no trace, which is the one thing a reviewer would need to reconstruct later.
    add_column :sitter_applications, :approved_despite_background_check, :boolean, default: false, null: false
  end
end
