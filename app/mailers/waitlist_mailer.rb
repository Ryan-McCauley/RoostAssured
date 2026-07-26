class WaitlistMailer < ApplicationMailer
  def welcome(waitlist_signup)
    @waitlist_signup = waitlist_signup
    @referral_url = root_url(ref: waitlist_signup.referral_code)
    @available_sitters = waitlist_signup.matching_sitters

    mail to: waitlist_signup.email, subject: "You're on the Roost Assured waitlist"
  end
end
