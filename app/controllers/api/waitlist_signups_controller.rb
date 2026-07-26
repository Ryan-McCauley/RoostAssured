class Api::WaitlistSignupsController < ApplicationController
  allow_unauthenticated_access
  rate_limit to: 5, within: 1.minute, by: -> { request.remote_ip }, only: :create,
             with: -> { render json: { errors: [ "Too many signups from this connection — please try again in a minute." ] }, status: :too_many_requests }

  def create
    waitlist_signup = WaitlistSignup.new(waitlist_signup_params)
    referred_by_code = params.dig(:waitlist_signup, :referred_by_code)
    waitlist_signup.referrer = WaitlistSignup.find_by(referral_code: referred_by_code) if referred_by_code.present?

    if waitlist_signup.save
      session[:waitlist_signup_id] = waitlist_signup.id
      WaitlistMailer.welcome(waitlist_signup).deliver_later
      available_sitters = waitlist_signup.matching_sitters
      render json: {
        waitlist_signup: waitlist_signup.as_json,
        available_sitters: available_sitters.map(&:as_json_public)
      }
    else
      render_errors(waitlist_signup)
    end
  end

  private

  def waitlist_signup_params
    params.require(:waitlist_signup).permit(:email, :city, :state, :zip_code, :role, :sitting_start_date, :sitting_end_date)
  end
end
