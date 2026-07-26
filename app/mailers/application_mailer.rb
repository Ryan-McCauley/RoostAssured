class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAILER_FROM", "Roost Assured <hello@roostassured.com>")
  layout "mailer"
end
