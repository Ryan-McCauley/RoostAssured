class PagesController < ApplicationController
  allow_unauthenticated_access

  # Renders the React SPA shell (app/views/pages/home.html.erb) for any non-API route.
  def home
  end
end
