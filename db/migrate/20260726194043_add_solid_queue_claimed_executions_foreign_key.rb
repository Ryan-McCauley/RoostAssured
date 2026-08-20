class AddSolidQueueClaimedExecutionsForeignKey < ActiveRecord::Migration[8.1]
  # CreateSolidCacheQueueCableTables transcribed solid_queue's schema by hand and dropped this one
  # foreign key; every sibling execution table kept theirs. db/schema.rb was pasted from the gem
  # template, which does declare it, so a database built by schema load ended up with the key and
  # one built by migrations did not. This closes that gap from the migration side.
  #
  # Guarded rather than plain: schema-loaded databases already have the key, and this needs to be a
  # no-op there instead of failing the deploy.
  def up
    return if claimed_executions_foreign_key?

    # add_foreign_key refuses to validate against orphans. A claimed execution whose job no longer
    # exists is exactly what the cascade would have removed, so clear those first.
    execute <<~SQL
      DELETE FROM solid_queue_claimed_executions ce
      WHERE NOT EXISTS (SELECT 1 FROM solid_queue_jobs j WHERE j.id = ce.job_id)
    SQL

    add_foreign_key :solid_queue_claimed_executions, :solid_queue_jobs, column: :job_id, on_delete: :cascade
  end

  def down
    return unless claimed_executions_foreign_key?

    remove_foreign_key :solid_queue_claimed_executions, :solid_queue_jobs, column: :job_id
  end

  private

  def claimed_executions_foreign_key?
    foreign_key_exists?(:solid_queue_claimed_executions, :solid_queue_jobs, column: :job_id)
  end
end
