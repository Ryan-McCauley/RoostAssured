class PagesController < ApplicationController
  def home
    @waitlist_signup = WaitlistSignup.new
  end
end
