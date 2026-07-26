class Api::Admin::WaitlistSignupsController < Api::AdminController
  def index
    waitlist_signups = WaitlistSignup.order(created_at: :desc)
    top_referrers = WaitlistSignup.where("referrals_count > 0").order(referrals_count: :desc).limit(10)
    counts_by_role = WaitlistSignup.group(:role).count
    top_zip_searches = ZipSearch.group(:zip_code).count.sort_by { |_, count| -count }.first(15)

    render json: {
      waitlist_signups: waitlist_signups.as_json,
      top_referrers: top_referrers.as_json,
      counts_by_role: counts_by_role,
      top_zip_searches: top_zip_searches
    }
  end
end
