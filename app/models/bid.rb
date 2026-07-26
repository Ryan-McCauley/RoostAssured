class Bid < ApplicationRecord
  STATUSES = %w[submitted passed accepted rejected].freeze
  JOB_STATUSES = %w[not_started on_the_way in_progress completed].freeze

  belongs_to :sitter
  belongs_to :owner, class_name: "User"
  has_many :payments, dependent: :destroy
  has_many :messages, dependent: :destroy
  has_many :job_tasks, -> { order(:position) }, dependent: :destroy

  validates :status, inclusion: { in: STATUSES }
  validates :job_status, inclusion: { in: JOB_STATUSES }
  validates :amount, presence: true, numericality: { greater_than: 0 }, unless: :passed?
  validates :sitter_id, uniqueness: { scope: :owner_id, message: "has already responded to this request" }
  validates :rating, inclusion: { in: 1..5 }, allow_nil: true
  validate :dates_are_within_the_owners_request
  validate :dates_are_not_both_accepted_and_declined
  validate :completed_only_once_every_task_is_done
  validate :completed_only_with_at_least_one_photo

  after_update_commit :broadcast_job_update, if: :saved_change_to_job_status?

  def passed?
    status == "passed"
  end

  def accepted?
    status == "accepted"
  end

  def rated?
    rating.present?
  end

  # Snapshots the owner's requested care tasks into individually trackable, photo-taggable
  # checklist items — run once, right when a bid is accepted and the job is created.
  def seed_job_tasks!
    return if job_tasks.exists?

    descriptions = owner.care_tasks.to_a.dup
    descriptions << owner.other_care_task if owner.other_care_task.present?
    descriptions.each_with_index { |description, index| job_tasks.create!(description: description, position: index) }
  end

  def broadcast_job_update
    JobChannel.broadcast_to(self, as_json_public)
  end

  def as_json_public
    {
      id: id, owner_id: owner_id, amount: amount, message: message,
      accepted_dates: accepted_dates, declined_dates: declined_dates, requested_dates: owner.sitting_dates,
      status: status, on_the_way_at: on_the_way_at, estimated_arrival_at: estimated_arrival_at, job_status: job_status, stale: stale,
      job_tasks: job_tasks.map(&:as_json_public), sitter_notes: sitter_notes,
      rating: rating, review: review, created_at: created_at, updated_at: updated_at
    }
  end

  # Admin-facing view of a job — a superset of the public fields plus both parties' identities,
  # since the admin dashboard needs to show who's involved without a separate lookup.
  def as_admin_json
    as_json_public.merge(
      sitter: { id: sitter.id, name: sitter.name },
      owner: { id: owner.id, name: owner.name }
    )
  end

  # Owner-facing view of a bid — includes the sitter's own identity/experience, since an
  # owner deciding whether to accept needs to know who's offering, not just the price.
  def as_owner_json
    as_json_public.merge(
      sitter: {
        id: sitter.id, name: sitter.name, city: sitter.city, state: sitter.state,
        bio: sitter.bio, years_experience: sitter.years_experience,
        travel_radius_miles: sitter.travel_radius_miles, own_flock: sitter.own_flock,
        average_rating: sitter.average_rating, ratings_count: sitter.ratings_count,
        profile_photo_url: sitter.profile_photo_url
      }
    )
  end

  private

  def dates_are_within_the_owners_request
    return unless owner

    requested = owner.sitting_dates
    stray = (accepted_dates + declined_dates) - requested
    errors.add(:base, "can only decide on dates the owner requested") if stray.any?
  end

  def dates_are_not_both_accepted_and_declined
    overlap = accepted_dates & declined_dates
    errors.add(:base, "can't accept and decline the same date") if overlap.any?
  end

  def completed_only_once_every_task_is_done
    return unless job_status == "completed"

    errors.add(:job_status, "can't be set to completed until every checklist item is marked done") if job_tasks.any? { |task| !task.completed? }
  end

  def completed_only_with_at_least_one_photo
    return unless job_status == "completed" && job_tasks.any?

    errors.add(:job_status, "requires at least one photo before it can be marked completed") unless job_tasks.any? { |task| task.photo.attached? }
  end
end
