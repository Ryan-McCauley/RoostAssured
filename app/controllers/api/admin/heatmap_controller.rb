class Api::Admin::HeatmapController < Api::AdminController
  def index
    zip_points = ZipSearch.where.not(latitude: nil).pluck(:latitude, :longitude)
    page_view_points = PageView.where.not(latitude: nil).pluck(:latitude, :longitude)
    render json: { zip_points: zip_points, page_view_points: page_view_points }
  end
end
