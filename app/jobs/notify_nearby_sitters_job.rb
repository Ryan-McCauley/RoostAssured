# Sending the new-request emails means running the nearby-sitter match, which touches every sitter
# in range. That is not work to do inside the request that saved the request.
class NotifyNearbySittersJob < ApplicationJob
  def perform(user_id)
    user = User.find_by(id: user_id)
    return if user.nil? || user.sitting_dates.blank?

    # Matching needs coordinates, and geocoding is queued separately, so the two jobs can race.
    # Doing it inline here when they're still missing is cheap and keeps ordering irrelevant.
    GeocodeUserJob.perform_now(user_id) if user.latitude.blank? || user.longitude.blank?
    user.reload

    SittingRequestMailer.receipt(user).deliver_later
    user.nearby_sitters.each { |sitter| SittingRequestMailer.new_request_alert(sitter, user).deliver_later }
  end
end
