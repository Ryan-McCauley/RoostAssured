# Every admin index used to serialize its whole table. The seed data alone puts 100,000 rows in
# zip_searches and page_views, so the problem is reproducible locally with one command.
#
# Deliberately hand-rolled rather than pulling in Kaminari or Pagy: this is one LIMIT/OFFSET and a
# count, used by a single-operator admin dashboard, and a dependency would earn its keep only if
# the app needed cursoring or view helpers.
module Paginated
  extend ActiveSupport::Concern

  DEFAULT_PER_PAGE = 50
  MAX_PER_PAGE = 200

  private

  def paginate(scope)
    scope.limit(per_page).offset((current_page - 1) * per_page)
  end

  # Sent alongside the rows so the dashboard can render "showing 50 of 3,214" and page controls.
  def pagination_meta(scope)
    # Strip ordering before counting: it does nothing for a COUNT and, with a select-list ordering
    # expression, Postgres will reject it outright.
    total = scope.reorder(nil).count
    total = total.size if total.is_a?(Hash) # grouped scopes count per group

    {
      page: current_page,
      per_page: per_page,
      total_count: total,
      total_pages: total.zero? ? 1 : (total.to_f / per_page).ceil
    }
  end

  def current_page
    [ params[:page].to_i, 1 ].max
  end

  def per_page
    requested = params[:per_page].to_i
    return DEFAULT_PER_PAGE if requested <= 0

    requested.clamp(1, MAX_PER_PAGE)
  end
end
