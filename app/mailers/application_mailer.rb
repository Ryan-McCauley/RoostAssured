class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAILER_FROM", "Roost Assured <noreply@roostassured.com>")
  layout "mailer"
end
