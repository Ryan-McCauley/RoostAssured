class JobTask < ApplicationRecord
  PHOTO_CONTENT_TYPES = %w[image/jpeg image/png image/webp image/heic image/heif].freeze

  belongs_to :bid
  has_one_attached :photo

  validates :description, presence: true
  validate :photo_is_an_acceptable_file

  def photo_url
    photo.attached? ? Rails.application.routes.url_helpers.rails_blob_path(photo, only_path: true) : nil
  end

  def as_json_public
    { id: id, description: description, completed: completed, position: position, photo_url: photo_url }
  end

  private

  def photo_is_an_acceptable_file
    return unless photo.attached?

    errors.add(:photo, "must be JPEG, PNG, WebP, or HEIC") unless photo.content_type.in?(PHOTO_CONTENT_TYPES)
    errors.add(:photo, "must be under 10MB") if photo.blob.byte_size > 10.megabytes
  end
end
