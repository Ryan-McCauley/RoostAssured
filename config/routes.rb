Rails.application.routes.draw do
  namespace :api do
    get "session", to: "sessions#show"
    resource :session, only: [:create, :destroy]
    resource :registration, only: [:create]
    resources :sitters, only: [:show]
    resource :account, only: [:show, :update]
    resource :stripe_payment_method, only: [:show, :create]
    resource :stripe_account, only: [:show] do
      post :onboarding_link, on: :collection
    end
    resource :sitter_profile, only: [:update]
    resource :sitter_application, only: [:create, :update]
    get "job_requests", to: "job_requests#index"
    post "job_requests/:owner_id/bid", to: "bids#create"
    patch "job_requests/:owner_id/bid", to: "bids#update"
    post "job_requests/:owner_id/pass", to: "bids#pass"
    get "bids", to: "received_bids#index"
    post "bids/:id/accept", to: "received_bids#accept"
    post "bids/:id/reject", to: "received_bids#reject"
    post "bids/:id/rate", to: "received_bids#rate"
    get "bids/:bid_id/messages", to: "messages#index"
    post "bids/:bid_id/messages", to: "messages#create"
    get "jobs", to: "jobs#index"
    patch "jobs/:id/status", to: "jobs#update_status"
    patch "jobs/:id/notes", to: "jobs#update_notes"
    patch "jobs/:id/eta", to: "jobs#update_eta"
    patch "jobs/:job_id/tasks/:id", to: "job_tasks#update"
    post "jobs/:job_id/tasks/:id/photo", to: "job_tasks#photo"
    resource :sitting_request, only: [:destroy]
    resources :availabilities, only: [:create, :destroy]
    resources :passwords, only: [:create], param: :token
    resources :password_resets, only: [:show, :update], param: :token
    resources :waitlist_signups, only: [:create]
    resource :zip_search, only: [:create, :destroy]
    resource :sitting_window, only: [:create]
    post "stripe/webhooks", to: "stripe_webhooks#create"
    get "home", to: "pages#home"

    namespace :admin do
      get "waitlist_signups", to: "waitlist_signups#index"
      get "users", to: "users#index"
      resources :service_areas, only: [:index, :create, :update, :destroy] do
        collection { get :geocode }
      end
      get "zip_searches", to: "zip_searches#index"
      get "heatmap", to: "heatmap#index"
      resources :sitter_applications, only: [:index] do
        member do
          post :approve
          post :reject
        end
      end
      resources :payments, only: [:index]
      resources :sitters, only: [:index] do
        member do
          post :deactivate
          post :reactivate
        end
      end
      get "jobs", to: "jobs#index"
    end
  end

  mount ActionCable.server => "/cable"

  get "up" => "rails/health#show", as: :rails_health_check

  root "pages#home"
  # Catch-all: let the React Router SPA handle any other non-API path.
  get "*path", to: "pages#home", constraints: ->(req) { !req.path.start_with?("/api", "/rails", "/up") }
end
