# The React frontend is served same-origin by Rails in production (via vite_rails),
# so this only needs to cover the Vite dev server's separate origin in development.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*(Rails.env.production? ? ENV.fetch("APP_HOST", "roostassured.com").then { |h| [ "https://#{h}", "https://www.#{h}" ] } : [ "http://localhost:5173", "http://localhost:3036" ]))

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      credentials: true
  end
end
