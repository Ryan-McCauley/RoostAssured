Rails.application.routes.draw do
  resources :waitlist_signups, only: [:create]

  get "up" => "rails/health#show", as: :rails_health_check

  root "pages#home"
end
