class Api::Admin::HeatmapController < Api::AdminController
  # A heatmap saturates long before this; sending every geocoded row (the seeds alone create
  # 100,000 of each) only makes the payload bigger, not the picture clearer.
  MAX_POINTS = 5_000

  def index
    zip_points = ZipSearch.where.not(latitude: nil).order(created_at: :desc).limit(MAX_POINTS).pluck(:latitude, :longitude)
    page_view_points = PageView.where.not(latitude: nil).order(created_at: :desc).limit(MAX_POINTS).pluck(:latitude, :longitude)
    render json: { zip_points: zip_points, page_view_points: page_view_points, max_points: MAX_POINTS }
  end
end
