# Roost Assured

A pet-sitting marketplace app (Rails API + React/Vite frontend), currently
launching in East Texas with a single sitter while demand data is collected.

## Stack

- Rails 8.1 (API), PostgreSQL, Solid Queue/Cache/Cable
- React 19 + Vite frontend (`app/frontend`), served by the same Rails app
- Stripe Connect for marketplace payments
- Resend (SMTP) for transactional email
- Hosted on Render (web service + Postgres + background worker)

## Local development

1. Install Ruby (see `.ruby-version`) and Node (see `.nvmrc`).
2. `bundle install && npm install`
3. `bin/rails db:prepare`
4. `bin/dev` (runs both `rails server` and `vite dev` per `Procfile.dev`)
5. Copy `.env.example` to `.env` and fill in Stripe test keys as needed.

Outgoing email is written to `tmp/mails` in development (no SMTP required).

## Environment variables

See `.env.example` for the full list. In production these are set on Render
directly, not loaded from a file.

## Deploying (Render)

This repo includes a `render.yaml` Blueprint that provisions:

- `roost-assured-web` — the Rails app, built from the repo `Dockerfile`
- `roost-assured-worker` — a Solid Queue worker for background jobs
- `roost-assured-db` — managed Postgres

Steps:

1. In the Render dashboard, **New > Blueprint**, point it at this repo.
2. Render reads `render.yaml` and creates the services above.
3. Set the `sync: false` env vars in the Render dashboard for `roost-assured-web`
   (and `roost-assured-worker` where applicable): `RAILS_MASTER_KEY`,
   `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `RESEND_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
4. Attach the `roostassured.com` custom domain to `roost-assured-web` and
   point its DNS at Render.
5. Add the Stripe webhook endpoint (`https://roostassured.com/api/stripe_webhooks`)
   in the Stripe dashboard and copy its signing secret into
   `STRIPE_WEBHOOK_SECRET`.

Uploaded files (sitter photos, resumes) are stored on a Render persistent disk
mounted at `/var/data` on the web service — see `config/storage.yml`.

## Testing

There is currently no automated test suite. Before handling real payments in
production, at minimum the Stripe charge flow, authentication, and the bid
state machine should have smoke-test coverage.
