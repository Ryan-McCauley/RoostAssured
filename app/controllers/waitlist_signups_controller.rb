class WaitlistSignupsController < ApplicationController
  def create
    @waitlist_signup = WaitlistSignup.new(waitlist_signup_params)

    if @waitlist_signup.save
      redirect_to root_path, notice: "You're on the list — we'll email you when Roost Assured launches near you."
    else
      flash.now[:alert] = @waitlist_signup.errors.full_messages.to_sentence
      render "pages/home", status: :unprocessable_entity
    end
  end

  private

  def waitlist_signup_params
    params.require(:waitlist_signup).permit(:email, :zip_code, :role)
  end
end
