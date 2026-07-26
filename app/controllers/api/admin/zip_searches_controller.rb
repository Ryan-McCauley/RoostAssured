class Api::Admin::ZipSearchesController < Api::AdminController
  def index
    total_searches = ZipSearch.count

    top_locations = ZipSearch.group(:city, :state, :zip_code).count
      .map { |(city, state, zip_code), count| { city:, state:, zip_code:, count: } }
      .sort_by { |row| -row[:count] }

    recent_searches = ZipSearch.order(created_at: :desc).limit(50)

    render json: { total_searches: total_searches, top_locations: top_locations, recent_searches: recent_searches.as_json }
  end
end
