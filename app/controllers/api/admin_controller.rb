class Api::AdminController < ApplicationController
  ADMIN_USERNAME = ENV.fetch("ADMIN_USERNAME") { "admin" if Rails.env.local? }
  ADMIN_PASSWORD = ENV.fetch("ADMIN_PASSWORD") { "admin" if Rails.env.local? }

  if ADMIN_USERNAME.blank? || ADMIN_PASSWORD.blank?
    raise "Set ADMIN_USERNAME and ADMIN_PASSWORD to enable the admin dashboard"
  end

  allow_unauthenticated_access
  http_basic_authenticate_with name: ADMIN_USERNAME, password: ADMIN_PASSWORD
  skip_after_action :track_page_view, raise: false
end
