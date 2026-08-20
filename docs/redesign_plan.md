# RoostAssured Redesign Plan — Marketplace → Local Farm Helper Directory

Status: **planned, not started.** Written 2026-07-27.

## 1. What changes and why

RoostAssured today is a two-sided pet-sitting **marketplace**: sitters apply, pay a $50
background-check fee, bid on jobs, and get paid through Stripe Connect with a 15% platform
take.

That model carries liability and cost the business cannot currently absorb: independent
contractor classification, FCRA adverse-action obligations, animal bailee / care-custody-control
insurance, payment facilitation, and a hard two-sided cold start in every new ZIP.

The redesign converts it into a **directory of independent local farm helpers**. The platform
lists providers, owners contact them directly, and no transaction passes through RoostAssured.

| | Today | After |
|---|---|---|
| Model | Marketplace | Directory / listings |
| Money between users | Stripe Connect, 15% take | None — never touched |
| Revenue | Take rate + $50 app fee | Provider subscription |
| Background checks | Platform-ordered (FCRA exposure) | Provider-furnished credential |
| Custody of animals | Yes (sitting) | No |
| Cold start | Two-sided, per ZIP | Seeded unilaterally from public data |

### Scope expansion: farm helpers, not just poultry

Poultry-only listings are too sparse per ZIP for search to return useful results. The directory
covers local farm, homestead, and livestock help generally, with poultry as the beachhead
vertical and the SEO entry point.

## 2. Guiding constraints

These are product constraints, not preferences. They exist to keep the platform inside
Section 230 protection and out of the liability the marketplace model created.

1. **Never touch a transaction.** No booking, no escrow, no payouts, no Connect. The only money
   RoostAssured collects is a provider's own subscription.
2. **Publish facts with provenance. Never publish characterizations.** A dated, sourced,
   checkable fact is data. An adjective is a representation, and representations are the
   platform's own speech — outside Section 230.
3. **The word "safe" does not appear on the site.** Neither do "verified," "trusted," "vetted,"
   or "screened" as standalone claims about a provider.
4. **The platform makes no eligibility decision based on a consumer report.** Providers obtain
   their own background checks and furnish the result. This keeps FCRA adverse-action machinery
   out of the product.
5. **Reviews are user content.** Display them; never summarize them editorially.

### Brand flag (open decision)

"RoostAssured" reads as (a) poultry-specific and (b) an assurance of quality. Both cut against
the redesign. Recommendation: keep the domain and brand, lead with poultry, use a tagline that
carries the broader scope, and add explicit "we do not guarantee or endorse any provider"
language site-wide so the name is not read as a representation. Revisit only if the directory
outgrows the poultry beachhead.

## 3. Target data model

### New

| Model | Purpose |
|---|---|
| `Provider` | A listing. Replaces `Sitter`. May be **unclaimed** (seeded from public sources) or **claimed** (belongs to a `User`). |
| `ServiceCategory` | Taxonomy parent — Poultry, Livestock, Property, Garden, General. |
| `Service` | Leaf service (e.g. "Coop cleaning"). Belongs to a category. |
| `ProviderService` | Join. Which services a provider offers. |
| `Credential` | Type, issuer, issued_on, expires_on, `self_furnished` flag, optional document attachment. |
| `Review` | Replaces `Bid#rating`. Belongs to provider + author. |
| `ListingClaim` | Audit trail for a user claiming an unclaimed listing. |
| `Subscription` | Stripe Billing subscription for a claimed listing. |

### Changed

- `Sitter` → `Provider`. Keeps `bio`, `years_experience`, `travel_radius_miles`, `profile_photo`,
  `deactivated_at`, geo helpers, `within_range?`. Drops `price_per_visit` (providers quote
  directly), `background_check_consent`, `stripe_onboarding_status`.
- `Provider.belongs_to :user` becomes **optional** — this is what makes seeding possible.
- `Message` currently `belongs_to :bid` (required). Re-point to a `Conversation` if messaging
  survives to Phase 5; otherwise retire.
- `Report` currently `belongs_to :bid, optional: true`. Re-point to `Provider`.
- `User` associations: drop `sitter`, `sitter_application`, `sitter_application_fees`,
  `bids_received`. Add `provider`, `reviews_authored`.

### Retired

Models: `Bid`, `Payment`, `JobTask`, `SitterApplication`, `SitterApplicationFee`, `StripeEvent`,
`CheckrEvent`, `Availability`.

Services: `app/services/stripe_payments/bid_payment_service.rb`,
`app/services/stripe_payments/application_fee_service.rb`, `app/services/checkr/` (entire dir).

Controllers: `bids`, `received_bids`, `jobs`, `job_tasks`, `sitter_applications`,
`checkr_webhooks`, `admin/payments`, `admin/sitter_applications`.

Kept as-is: `User`, `Session`, `Block`, `Report`, `PageView`, `ZipSearch`, `ServiceArea`,
`WaitlistSignup`, authentication concern, `NominatimGeocoder`, `IpGeolocator`,
`HaversineDistance`.

Kept but repurposed: `stripe_webhooks_controller` — Billing events only (invoice paid,
subscription cancelled), not Connect.

## 4. Service taxonomy (seed data)

**Poultry** — coop cleaning · coop building & repair · flock sitting · brooder setup ·
predator-proofing · processing

**Livestock** — goat & sheep care · horse care & stall mucking · hoof trimming · shearing ·
livestock hauling · feeding while away

**Property** — fencing (install & repair) · barn cleaning · brush clearing · hay hauling &
stacking · irrigation · tractor & equipment repair

**Garden / homestead** — raised beds · orchard pruning · composting · greenhouse setup

**General** — whole-farm sitting · house + farm sitting · seasonal & harvest help

Store as seeded records, not enums — the taxonomy will change and admin should edit it without
a deploy.

## 5. Phases

### Phase 0 — Decisions and legal prep (no code)

- Form the Texas LLC. Separate bank account, separate card.
- Rewrite Terms of Service. Required clauses: **arbitration + class action waiver**, limitation
  of liability, disclaimer of warranties (explicit: no screening, no verification, no
  endorsement), user indemnification, Texas forum selection, 13+ age minimum.
- Register a **DMCA designated agent** with the Copyright Office (~$6). Required for safe harbor
  once users upload photos.
- Add an unclaimed-listing removal policy: factual data from public sources only, removed on
  request, no argument.
- One hour with a lawyer on the provider-furnished credential structure (§2.4). This is the only
  item worth paying for.
- Get quotes (do not buy) for media liability + cyber. Expect $500–1,500/yr.

### Phase 1 — Strip the marketplace

One deletion PR. Everything is recoverable from git history.

- Remove retired models, controllers, services, and routes from §3.
- Remove frontend: `JobRequests.jsx`, `BecomeSitter.jsx` (rewritten later), bid/messaging UI,
  `admin/Payments.jsx`.
- Drop Stripe Connect entirely; keep the `stripe` gem for Billing.
- Migration: drop retired tables. Rename `sitters` → `providers`, make `user_id` nullable.
- Verify the app boots and auth still works. A Minitest suite already exists (23 files under
  `test/`); prune the tests covering retired models and add coverage for `Provider` and search.
  (The README's "no automated test suite" line is stale and should be corrected.)

### Phase 2 — Directory core (launchable MVP)

The goal is a site useful to owners with **zero registered providers**.

- `Provider`, `ServiceCategory`, `Service`, `ProviderService` models + admin CRUD.
- Seed listings by hand from public sources across the top 3 metros. Name, city, state, ZIP,
  services, website, phone. `claimed_at: nil`.
- Search: extend the existing ZIP + `travel_radius_miles` matching with a service-type filter.
  `ZipSearchForm.jsx` already exists — add a service selector.
- Listing detail page (replaces `SitterShow.jsx`): services, service area, contact info,
  "unclaimed listing" banner with a claim CTA.
- Every listing page carries the standing disclaimer: RoostAssured does not screen, verify, or
  endorse providers.
- SEO: `useSeo.js` already exists. Target `{service} + {city}` pages — that is the whole
  acquisition strategy.

**Ship here. Measure with the instrumentation already built** (`ZipSearch`, `PageView`,
`WaitlistSignup`).

### Phase 3 — Claiming and revenue

- `ListingClaim` flow: provider verifies control of the listed email or phone, then owns it.
- Stripe Billing subscription, **$30/month**. Free tier = unclaimed/basic. Paid tier = photos,
  full service list, credential display, search priority.
- Repurpose `stripe_webhooks_controller` for Billing events.
- Provider dashboard: edit listing, view profile traffic (drives renewal — providers pay when
  they can see the leads).

### Phase 4 — Trust layer

Built strictly to the §2 constraints.

- `Credential` model + upload. Types: background check, certificate of insurance, business
  license, professional certification.
- `TrustPanel` component. Renders **facts only**, each with issuer and date:
  - "Background check completed by Checkr, 2026-03-14 — self-furnished"
  - "Certificate of insurance on file — expires 2027-01-01"
  - "4.6 average, 17 reviews"
  - Never: verified · trusted · safe · vetted · top-rated
- `Review` model. Owners review providers. Display raw; no editorial summary.
- Credential expiry job — expired credentials stop displaying automatically.

### Phase 5 — Community and moderation

- `Conversation` + re-pointed `Message` if on-platform contact proves worth the moderation cost.
  Direct contact (phone/email) is the Phase 2–4 default and may be sufficient permanently.
- `Block` and `Report` already exist — wire `Report` to `Provider` and ensure a report triggers
  human review, not just a row.
- Local layer: the thing BackYardChickens.com structurally does not do. City ordinance info,
  local flock groups, chick/egg swaps.

## 6. Acquisition

Free channels only, in priority order:

1. **SEO** — `{service} + {city}` pages. Uncontested keywords, compounds over time, and the
   reason the directory has to be seeded before it is promoted.
2. **BackYardChickens.com** — 530k members, 28M posts, and active threads asking what to pay for
   coop cleaning. Participate genuinely; answer questions well; let the profile do the work.
   Self-promo rules are strict and a ban burns the channel permanently. One shot.
3. **Local Facebook groups** — poultry, homestead, and small-farm groups per target metro.
4. **Direct provider outreach** — the seeded listings are the pitch. "You're already listed;
   claim it."

Target metros (from `docs/market_research_backyard_chicken_owners.md`): start with **Austin,
Nashville, and Raleigh-Durham**. Texas-friendly on IC classification; the stricter tests in
CO/OR/WA and California's ABC test matter less under a directory model but still argue for
sequencing.

## 7. Success criteria

Gate each phase on evidence, not completion.

| Phase | Ship the next phase only if |
|---|---|
| 2 | Owners run ZIP searches unprompted and listing pages get repeat organic traffic |
| 3 | ≥10 providers claim listings; ≥3 convert to paid |
| 4 | Providers ask for credential display, or owners cite its absence |
| 5 | Direct contact is demonstrably losing leads |

Revenue shape at maturity: **$30/mo × 100–300 providers = $36k–108k/yr**, near-zero marginal
cost, solo-operable. This is a lifestyle business, not a venture-scale one, and should be
measured against that bar.

## 8. Open questions

- Brand: keep "RoostAssured" past the poultry beachhead? (§2)
- Do unclaimed listings need an opt-out email before going live, or is removal-on-request enough?
- Subscription vs. featured-placement pricing once density is real.
- Whether messaging is ever worth its moderation cost.
