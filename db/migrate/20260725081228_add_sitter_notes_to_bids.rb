class AddSitterNotesToBids < ActiveRecord::Migration[8.1]
  def change
    add_column :bids, :sitter_notes, :text
  end
end
