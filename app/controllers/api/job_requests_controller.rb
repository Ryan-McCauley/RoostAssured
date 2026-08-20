class Api::JobRequestsController < ApplicationController
  def index
    sitter = current_user.sitter
    return render json: { errors: [ "You need an approved sitter profile to view job requests." ] }, status: :forbidden unless sitter

    # Distance comes back alongside each owner, so it is computed once rather than recalculated
    # here for display.
    matches = sitter.matching_job_requests_with_distance
    bids_by_owner = sitter.bids.where(owner_id: matches.map { |owner, _| owner.id }).index_by(&:owner_id)

    requests = matches.map do |owner, distance|
      owner.as_job_request_json(distance_miles: distance, bid: bids_by_owner[owner.id])
    end
    active_requests, passed_requests = requests.partition { |r| r[:my_bid].nil? || r[:my_bid][:status] != "passed" }

    render json: {
      sitter: sitter.as_json_public,
      job_requests: active_requests,
      passed_requests: passed_requests
    }
  end
end
