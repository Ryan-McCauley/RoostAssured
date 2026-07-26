class Api::JobRequestsController < ApplicationController
  def index
    sitter = current_user.sitter
    return render json: { errors: [ "You need an approved sitter profile to view job requests." ] }, status: :forbidden unless sitter

    owners = sitter.matching_job_requests
    bids_by_owner = sitter.bids.where(owner_id: owners.map(&:id)).index_by(&:owner_id)

    requests = owners.map do |owner|
      owner.as_job_request_json(
        distance_miles: HaversineDistance.miles_between(sitter.latitude, sitter.longitude, owner.latitude, owner.longitude),
        bid: bids_by_owner[owner.id]
      )
    end
    active_requests, passed_requests = requests.partition { |r| r[:my_bid].nil? || r[:my_bid][:status] != "passed" }

    render json: {
      sitter: sitter.as_json_public,
      job_requests: active_requests,
      passed_requests: passed_requests
    }
  end
end
