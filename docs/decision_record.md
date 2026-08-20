# Decision Record — RoostAssured

**Date:** 2026-07-27
**Decision:** Shelved. Not pursuing further as a platform business.
**Cost to reach this decision:** ~4 days of build time (first commit 2026-07-23) and ~$25 of hosting.

Read this before restarting. It exists so the same research doesn't get redone.

---

## 1. What was evaluated

Five business models, in the order they were considered. Each was abandoned for a specific,
recorded reason.

### 1.1 Pet-sitting marketplace (what was built)

Rails 8.1 + React 19, Stripe Connect at a 15% take, $50 non-refundable sitter application fee
covering a Checkr background check, bid-based pricing, ZIP-radius matching.

**Why abandoned:**

- **Ceiling too low.** A 2M-person metro at ~4% chicken-owning households, ~20% ever willing to
  pay a stranger, ~2 trips/year at ~$175/booking yields ~$2.1M GMV at **100% market share** —
  ~$315k revenue at a 15% take. Realistic early penetration of 2–5% returns $6–15k per metro per
  year. Every metro is a separate cold start.
- **Disintermediation is near-total.** An owner who finds a good sitter pays them directly the
  second time. Frequency is too low to build the habit that keeps Rover-style platforms alive.
- **Charging the scarce side.** The $50 fee taxed supply — the side with no liquidity — while
  Checkr costs ~$30–35, so it wasn't even margin.
- **Unpriced liability.** Sitters rotating between flocks are an HPAI vector, and standard general
  liability **excludes** animals in your care (the care-custody-control exclusion). The
  worst-case claim was the one a default policy wouldn't cover.
- **IC classification** exposure across target states, plus FCRA adverse-action obligations that
  the Checkr flow never implemented.

### 1.2 Community / forum

**Why abandoned:** occupied at a scale that isn't attackable. [BackYardChickens.com](https://www.backyardchickens.com/forums/),
read live 2026-07-27: **530,826 members, 28,489,901 messages**, individual sub-forums with 121.6K
threads, posts landing minutes apart, running since ~2007. Professionally monetized as a Raptive
partner site, with an adjacent network (BackYardHerds, SufficientSelf, TheEasyGarden), a
newsletter, a store, and sponsors.

**Correction worth preserving:** BYC is *not* a competitor to a local services product. It is an
audience proof and a potential acquisition channel — 530k self-identified flock owners in one
place. It only competes with a general-purpose community play.

### 1.3 Content — city-by-city chicken ordinance database

**Why abandoned:** already occupied by multiple players. [Backyard Chickens Hub](https://backyardchickenshub.com/tools/legal-checker)
has a legal checker covering 500+ municipalities updated for 2026; [Mile Four](https://milefour.com/blogs/learn/backyard-chickens-ownership-laws)
has a state-then-city lookup; CityRuleLookup covers California; BYC maintains its own ordinance
database. Additional 2026 headwind: AI overviews and zero-click search are compressing
informational-content traffic generally.

### 1.4 Certification body

Sell a credential to flock/farm care providers — published standard, coursework, document
review, badge, public registry.

**Genuine white space:** NPIP certifies *flocks* (USDA/state, for breeders shipping birds).
[PSI](https://www.petsit.com/certification) and [NAPPS](https://petsitters.org/membership_plans_and_cost.php)
certify dog-and-cat sitters. **Nobody certifies a person who cares for someone else's flock.**

**Pricing benchmarks:** PSI $155/yr membership + $275 one-time exam (3-yr validity, 30 CEUs to
renew). NAPPS $245 members / $395 non-members, $135/yr membership bundling a directory listing.

**Also the only model with no local density requirement** — a provider anywhere can certify,
which dissolves the per-ZIP cold start.

**Why abandoned:** rejected by owner. It is a credibility-and-sales business, not a software
business — the work is convincing state associations and extension services to lend reputation,
and selling a badge nobody recognizes. A new certificate from an unknown issuer is worth zero on
day one, and solving that is harder than building the product.

### 1.5 Local farm-helper directory (the plan in `redesign_plan.md`)

Directory of independent local farm/flock service providers. Seeded unilaterally from public
sources, so it is useful on day one with zero registered users. No payments, no custody, no
hiring — the lowest-liability model evaluated.

**Why abandoned:** revenue is far downstream. Nobody pays to be *listed*; they pay to be *found*,
and being found requires an audience that takes 12–24 months of SEO to build. In a directory the
listings are the inventory, not the product — the audience is the product. That means roughly a
year of unpaid work before the first dollar, and a ceiling of ~$40–100k/yr as a lifestyle
business.

The plan remains in [redesign_plan.md](redesign_plan.md) and is complete enough to execute if the
economics ever become acceptable.

---

## 2. What actually validated

This is the important part. One thing in this entire evaluation was demonstrated rather than
hypothesized:

**Demand for coop cleaning and farm chore help is real, articulated, and being paid for today.**

- Owners publicly asking what to pay, on BYC: [thread 1600620](https://www.backyardchickens.com/threads/how-much-should-i-pay-to-have-my-coop-cleaned-out.1600620/),
  [1637895](https://www.backyardchickens.com/threads/coop-cleaning-service.1637895/),
  [1642070](https://www.backyardchickens.com/threads/coop-cleaning-prices.1642070/latest).
- Operating businesses charging for it: [Chicken Tenders ATX](https://chickentenders-atx.com/coop-clean/)
  (Austin), [Tidy Coops](https://www.tidycoops.com/chicken-coop-services) (founded 2024),
  [Coops and Roots](https://coopsandroots.com/), [The Garden Hen](https://the-garden-hen.com/services/coop-services/).
- Pricing anchor: local handyperson work ~$60/hr; operators price by coop size, flock size, and
  frequency, with the first deep clean higher and recurring discounted.

**Coop maintenance is a structurally better service than sitting:** recurring rather than
episodic, higher ticket, no seasonality cliff, larger addressable base (every owner has a coop;
only travelers need a sitter), and — critically — **the owner is usually home, so there is no
custody of animals and the care-custody-control insurance problem largely disappears.**

**Market context:** ~11M US households keep chickens (~85M birds), reportedly the third most
popular pet. First-time chick buying softened as egg prices normalized; most current demand is
existing owners replenishing. Note also an active CDC investigation into backyard-poultry
salmonella — 184 illnesses, 31 states, 53 hospitalizations, 1 death as of May 2026.

---

## 3. Why the project stopped

The validated business is a **local chicken-and-farm-care service company** — one operator, one
metro, doing the work.

That is not a business the owner wants to run. The blocker is preference, not uncertainty: the
free demand test (§5) was never run because a positive result would not have changed the
decision.

Every *platform* version of this idea failed on either cold start or occupancy. That is not
coincidence — services have customers on day one; platforms have chicken-and-egg problems.

---

## 4. What would change the answer

Restart is worth considering if any of these become true:

- **Willingness to operate the service** for 6–12 months in one metro. This is the only path with
  demonstrated demand, and running it is the prerequisite for credibly aggregating others later.
- **An existing audience.** The directory and certification models both fail on distribution, not
  on product. Arriving with traffic already in hand changes both.
- **A partner who wants to operate** while you build. The split solves the exact impasse above.
- **USDA APHIS publishes the NAHMS 2024 Backyard Animal Keeping Study.** It was unpublished as of
  2026-07-24 and would upgrade several proxy-based market claims to hard data. Denver and Miami
  were study sites.
- **The certification white space is still open** and remains genuinely unoccupied (§1.4). It
  needs a credibility partner, not code.

---

## 5. The demand test that was never run

Preserved because it cost $0 and still works:

1. **Audit existing supply** — search Google, Craigslist, Facebook Marketplace, and Thumbtack for
   flock/farm services across target metros. Already partly done, see §2.
2. **Facebook poll** in 8–10 local backyard-chicken groups: *"When you travel, what happens to
   your flock? (a) neighbor/friend, free (b) family (c) I pay someone (d) I don't travel."*
   Option (c) is the entire market.
3. **Craigslist supply post** in 3–4 metros; count unsolicited inbound. Stated preference is
   worthless; a ringing phone isn't.

**Pass threshold:** poll option (c) above ~10%, at least 3 inbound contacts, and evidence someone
already charges for this. Two of three justified proceeding.

---

## 6. What is reusable

The codebase is not chicken-specific and is the most valuable output.

**Transferable to any local-services product:** authentication and sessions, Nominatim geocoding,
IP geolocation, Haversine ZIP-radius matching, service-area modeling, Stripe Connect onboarding
and payment flows, an admin console with a heatmap, block/report moderation, waitlist with
referral codes, ZIP-search and page-view instrumentation, and four drafted legal pages.

**Test suite:** 23 test files under `test/` — models, controllers, services, mailers. Note the
README's "There is currently no automated test suite" line is **stale** and should be corrected
if work resumes.

**Research assets:** [market_research_backyard_chicken_owners.md](market_research_backyard_chicken_owners.md)
(demographics, geographic proxies, 12 ranked target metros) and
[redesign_plan.md](redesign_plan.md) (complete directory-model spec).

**Housekeeping if shelving for real:** the domain is worth parking (~$15/yr). Render services can
be suspended to drop hosting to $0. No LLC was ever formed, no real Checkr key was ever
configured, and Stripe never went live — so there is nothing to wind down and no entity to
dissolve.
