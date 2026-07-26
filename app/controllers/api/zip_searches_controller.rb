class Api::ZipSearchesController < ApplicationController
  allow_unauthenticated_access
  rate_limit to: 10, within: 1.minute, by: -> { request.remote_ip }, only: :create,
             with: -> { render json: { errors: [ "Too many searches from this connection — please try again in a minute." ] }, status: :too_many_requests }

  def create
    zip_search = ZipSearch.new(city: params[:city], state: params[:state], zip_code: params[:zip_code])

    if zip_search.save
      geocoded = NominatimGeocoder.geocode(zip_search.zip_code)
      zip_search.update_columns(latitude: geocoded.latitude, longitude: geocoded.longitude) if geocoded

      session[:searched_city] = zip_search.city
      session[:searched_state] = zip_search.state
      session[:searched_zip] = zip_search.zip_code
      session[:searched_lat] = geocoded&.latitude
      session[:searched_lng] = geocoded&.longitude

      render json: {
        city: zip_search.city, state: zip_search.state, zip_code: zip_search.zip_code,
        latitude: geocoded&.latitude, longitude: geocoded&.longitude,
        zip_is_live: ServiceArea.live?(geocoded&.latitude, geocoded&.longitude)
      }
    else
      render_errors(zip_search)
    end
  end

  def destroy
    session.delete(:searched_city)
    session.delete(:searched_state)
    session.delete(:searched_zip)
    session.delete(:searched_lat)
    session.delete(:searched_lng)
    session.delete(:sitting_window_asked)
    session.delete(:sitting_start_date)
    session.delete(:sitting_end_date)
    head :no_content
  end
end
