class SittingRequestMailer < ApplicationMailer
  def receipt(user)
    @user = user
    mail to: @user.email_address, subject: "We've got your chicken sitting request"
  end

  def new_request_alert(sitter, user)
    @sitter = sitter
    @user = user
    mail to: @sitter.email_address, subject: "New chicken sitting request near #{@user.city}"
  end
end
