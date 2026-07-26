# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_07_25_222345) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "availabilities", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "end_date", null: false
    t.bigint "sitter_id", null: false
    t.date "start_date", null: false
    t.datetime "updated_at", null: false
    t.index ["sitter_id"], name: "index_availabilities_on_sitter_id"
    t.index ["start_date", "end_date"], name: "index_availabilities_on_start_date_and_end_date"
  end

  create_table "bids", force: :cascade do |t|
    t.date "accepted_dates", default: [], null: false, array: true
    t.decimal "amount", precision: 6, scale: 2
    t.datetime "created_at", null: false
    t.date "declined_dates", default: [], null: false, array: true
    t.datetime "estimated_arrival_at"
    t.string "job_status", default: "not_started", null: false
    t.text "message"
    t.datetime "on_the_way_at"
    t.bigint "owner_id", null: false
    t.integer "rating"
    t.text "review"
    t.bigint "sitter_id", null: false
    t.text "sitter_notes"
    t.boolean "stale", default: false, null: false
    t.string "status", default: "submitted", null: false
    t.datetime "updated_at", null: false
    t.index ["owner_id"], name: "index_bids_on_owner_id"
    t.index ["sitter_id", "owner_id"], name: "index_bids_on_sitter_id_and_owner_id", unique: true
    t.index ["sitter_id"], name: "index_bids_on_sitter_id"
  end

  create_table "job_tasks", force: :cascade do |t|
    t.bigint "bid_id", null: false
    t.boolean "completed", default: false, null: false
    t.datetime "created_at", null: false
    t.string "description", null: false
    t.integer "position", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["bid_id"], name: "index_job_tasks_on_bid_id"
  end

  create_table "messages", force: :cascade do |t|
    t.bigint "bid_id", null: false
    t.text "body"
    t.datetime "created_at", null: false
    t.bigint "sender_id", null: false
    t.datetime "updated_at", null: false
    t.index ["bid_id"], name: "index_messages_on_bid_id"
    t.index ["sender_id"], name: "index_messages_on_sender_id"
  end

  create_table "page_views", force: :cascade do |t|
    t.string "city"
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.decimal "latitude", precision: 9, scale: 6
    t.decimal "longitude", precision: 9, scale: 6
    t.string "path"
    t.string "region"
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["user_id"], name: "index_page_views_on_user_id"
  end

  create_table "payments", force: :cascade do |t|
    t.date "accepted_dates", default: [], null: false, array: true
    t.decimal "amount", precision: 8, scale: 2, null: false
    t.decimal "application_fee_amount", precision: 8, scale: 2, null: false
    t.bigint "bid_id", null: false
    t.datetime "created_at", null: false
    t.string "status", default: "pending", null: false
    t.string "stripe_payment_intent_id", null: false
    t.datetime "updated_at", null: false
    t.index ["bid_id"], name: "index_payments_on_bid_id"
    t.index ["stripe_payment_intent_id"], name: "index_payments_on_stripe_payment_intent_id", unique: true
  end

  create_table "service_areas", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "latitude", precision: 9, scale: 6, null: false
    t.decimal "longitude", precision: 9, scale: 6, null: false
    t.string "name", default: "", null: false
    t.integer "radius_miles", default: 10, null: false
    t.datetime "updated_at", null: false
    t.index "lower((name)::text)", name: "index_service_areas_on_lower_name", unique: true
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "ip_address"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "sitter_applications", force: :cascade do |t|
    t.string "availability_days", default: [], null: false, array: true
    t.string "availability_times", default: [], null: false, array: true
    t.boolean "background_check_consent", default: false, null: false
    t.text "bio"
    t.string "city"
    t.datetime "created_at", null: false
    t.string "first_name"
    t.string "last_name"
    t.string "middle_name"
    t.boolean "own_flock", default: false, null: false
    t.decimal "price_per_visit", precision: 6, scale: 2
    t.datetime "reviewed_at"
    t.string "state"
    t.string "status", default: "pending", null: false
    t.string "street_address"
    t.integer "travel_radius_miles", default: 10, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.integer "years_experience"
    t.string "zip_code"
    t.index ["user_id"], name: "index_sitter_applications_on_user_id", unique: true
  end

  create_table "sitters", force: :cascade do |t|
    t.boolean "background_check_consent", default: false, null: false
    t.text "bio"
    t.datetime "created_at", null: false
    t.datetime "deactivated_at"
    t.decimal "fee_percentage", precision: 5, scale: 2, default: "15.0", null: false
    t.boolean "own_flock", default: false, null: false
    t.decimal "price_per_visit", precision: 6, scale: 2
    t.string "stripe_account_id"
    t.string "stripe_onboarding_status", default: "not_started", null: false
    t.integer "travel_radius_miles", default: 10, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.integer "years_experience"
    t.index ["deactivated_at"], name: "index_sitters_on_deactivated_at"
    t.index ["stripe_account_id"], name: "index_sitters_on_stripe_account_id", unique: true
    t.index ["user_id"], name: "index_sitters_on_user_id", unique: true
  end

  create_table "stripe_events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "stripe_event_id", null: false
    t.datetime "updated_at", null: false
    t.index ["stripe_event_id"], name: "index_stripe_events_on_stripe_event_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "address"
    t.string "care_tasks", default: [], null: false, array: true
    t.string "city"
    t.string "coop_features", default: [], null: false, array: true
    t.datetime "created_at", null: false
    t.string "email_address", null: false
    t.string "feed_location"
    t.integer "feeder_count"
    t.string "flock_size_tier"
    t.decimal "latitude", precision: 9, scale: 6
    t.decimal "longitude", precision: 9, scale: 6
    t.string "name", default: "", null: false
    t.string "other_care_task"
    t.string "password_digest", null: false
    t.string "phone_number"
    t.date "sitting_dates", default: [], null: false, array: true
    t.string "sitting_type"
    t.text "special_requests"
    t.string "state"
    t.string "stripe_customer_id"
    t.datetime "updated_at", null: false
    t.string "water_location"
    t.integer "waterer_count"
    t.string "zip_code"
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  create_table "waitlist_signups", force: :cascade do |t|
    t.string "city"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "referral_code"
    t.integer "referrals_count", default: 0, null: false
    t.bigint "referred_by_id"
    t.string "role"
    t.date "sitting_end_date"
    t.date "sitting_start_date"
    t.string "state"
    t.datetime "updated_at", null: false
    t.string "zip_code"
    t.index ["email"], name: "index_waitlist_signups_on_email", unique: true
    t.index ["referral_code"], name: "index_waitlist_signups_on_referral_code", unique: true
    t.index ["referred_by_id"], name: "index_waitlist_signups_on_referred_by_id"
  end

  create_table "zip_searches", force: :cascade do |t|
    t.string "city"
    t.datetime "created_at", null: false
    t.decimal "latitude", precision: 9, scale: 6
    t.decimal "longitude", precision: 9, scale: 6
    t.string "state"
    t.datetime "updated_at", null: false
    t.string "zip_code", null: false
    t.index ["zip_code"], name: "index_zip_searches_on_zip_code"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "availabilities", "sitters"
  add_foreign_key "bids", "sitters"
  add_foreign_key "bids", "users", column: "owner_id"
  add_foreign_key "job_tasks", "bids"
  add_foreign_key "messages", "bids"
  add_foreign_key "messages", "users", column: "sender_id"
  add_foreign_key "page_views", "users"
  add_foreign_key "payments", "bids"
  add_foreign_key "sessions", "users"
  add_foreign_key "sitter_applications", "users"
  add_foreign_key "sitters", "users"
  add_foreign_key "waitlist_signups", "waitlist_signups", column: "referred_by_id"
end
