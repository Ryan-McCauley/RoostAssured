class Api::PagesController < ApplicationController
  allow_unauthenticated_access

  def home
    searched_lat = session[:searched_lat]
    searched_lng = session[:searched_lng]
    searched_zip = session[:searched_zip]
    searched_city = session[:searched_city]
    searched_state = session[:searched_state]
    confirmed_signup = WaitlistSignup.find_by(id: session[:waitlist_signup_id]) if session[:waitlist_signup_id]
    zip_is_live = ServiceArea.live?(searched_lat, searched_lng)

    render json: {
      searched_city: searched_city,
      searched_state: searched_state,
      searched_zip: searched_zip,
      searched_lat: searched_lat,
      searched_lng: searched_lng,
      zip_is_live: zip_is_live,
      sitting_window_asked: session[:sitting_window_asked].present?,
      sitting_start_date: session[:sitting_start_date],
      sitting_end_date: session[:sitting_end_date],
      confirmed_signup: confirmed_signup&.as_json,
      available_sitters: confirmed_signup ? confirmed_signup.matching_sitters.map(&:as_json_public) : [],
      nearby_sitters: zip_is_live ? nearby_sitters(searched_zip, searched_city, searched_state).map(&:as_json_public) : []
    }
  end

  private

  def nearby_sitters(zip_code, city, state)
    scope = Sitter.joins(:user)
    return scope.none if zip_code.blank? && (city.blank? || state.blank?)

    zip_code.present? ? scope.where(users: { zip_code: zip_code }) : scope.where(users: { city: city, state: state })
  end
end
