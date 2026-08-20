class WaitlistMailer < ApplicationMailer
  def welcome(waitlist_signup)
    @waitlist_signup = waitlist_signup
    @referral_url = root_url(ref: waitlist_signup.referral_code)

    mail to: waitlist_signup.email, subject: "You're an early bird on the Roost Assured waitlist"
  end
end
