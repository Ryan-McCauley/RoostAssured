class Session < ApplicationRecord
  # A signed session cookie is a bearer credential: anything that captures one (a shared or stolen
  # device, a backup, a leaked log) can replay it. Bounded lifetimes cap how long that is worth.
  INACTIVITY_TIMEOUT = 30.days
  ABSOLUTE_TIMEOUT = 90.days

  # Writing on every request would mean a DB write per page view, so activity is only recorded
  # once an hour — well inside the inactivity window.
  TOUCH_INTERVAL = 1.hour

  belongs_to :user

  def expired?
    updated_at < INACTIVITY_TIMEOUT.ago || created_at < ABSOLUTE_TIMEOUT.ago
  end

  def touch_if_stale
    touch if updated_at < TOUCH_INTERVAL.ago
  end
end
