class Api::Admin::ServiceAreasController < Api::AdminController
  def index
    render json: { service_areas: ServiceArea.order(:name).as_json }
  end

  def create
    service_area = ServiceArea.new(service_area_params)

    if service_area.save
      render json: { service_area: service_area.as_json, service_areas: ServiceArea.order(:name).as_json }
    else
      render_errors(service_area)
    end
  end

  def update
    service_area = ServiceArea.find(params[:id])

    if service_area.update(service_area_params)
      render json: { service_area: service_area.as_json, service_areas: ServiceArea.order(:name).as_json }
    else
      render_errors(service_area)
    end
  end

  def destroy
    ServiceArea.find(params[:id]).destroy
    render json: { service_areas: ServiceArea.order(:name).as_json }
  end

  def geocode
    result = NominatimGeocoder.search(params[:q])

    if result
      render json: { latitude: result.latitude, longitude: result.longitude }
    else
      render json: { error: "Couldn't find that location." }, status: :unprocessable_entity
    end
  end

  private

  def service_area_params
    params.require(:service_area).permit(:name, :latitude, :longitude, :radius_miles)
  end
end
