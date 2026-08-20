class Api::Admin::ZipSearchesController < Api::AdminController
  def index
    total_searches = ZipSearch.count

    # Bounded in SQL rather than sorting the whole grouped result in Ruby -- the dashboard only
    # ever renders the head of this list.
    top_locations = ZipSearch.group(:city, :state, :zip_code).order(Arel.sql("COUNT(*) DESC")).limit(50).count
      .map { |(city, state, zip_code), count| { city:, state:, zip_code:, count: } }

    recent_searches = ZipSearch.order(created_at: :desc).limit(50)

    render json: { total_searches: total_searches, top_locations: top_locations, recent_searches: recent_searches.as_json }
  end
end
