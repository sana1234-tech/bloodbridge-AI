# BloodBridge AI — Submission Write-up

**Category:** Healthcare · Emergency Blood Coordination

**Live product:** https://bloodbridge-ai-two.vercel.app
**Source code:** https://github.com/sana1234-tech/bloodbridge-AI

## The problem, and who it affects

When a patient in Pakistan needs blood urgently, their family enters a desperate phone tree — calling relatives, posting on Facebook and WhatsApp, and driving from one blood bank to another while the clock runs out. Three failures compound the crisis. First, matching is manual and slow: there is no single place where a verified medical need meets willing, *eligible* donors. Second, safety rules are ignored: Pakistan's blood transfusion guidelines require a 90-day rest between donations for men and 120 days for women, yet informal networks contact whoever answers, regardless of eligibility. Third, anyone can post anything: unverified requests circulate publicly with patient names and donor phone numbers attached — no way to tell a genuine hospital need from spam, and privacy is traded away in the panic. This affects patients in emergencies and childbirth, thalassemia patients who need transfusions every few weeks for life, hospitals and blood banks coordinating under time pressure, and voluntary donors who want to help safely.

## Our solution, and who it serves

BloodBridge AI is a working emergency blood coordination platform built around three systems. **Safety-first donor matching** ranks compatible donors by blood type, distance, donation recency and reliability — and *hard-blocks* anyone still inside the mandatory 90/120-day resting window; ineligible donors are excluded entirely, never just ranked lower. **Self-verifying demand forecasts** predict 7 days of demand per city and blood group (weighted moving average + trend + weekday seasonality) — and the model is *backtested daily against real demand*, with its ~80–84% accuracy (112 forecasts) displayed live in the product. An **assistant chatbot** answers compatibility, eligibility and inventory questions instantly.

The platform serves **verified hospital and blood-bank staff**, who post requests; **screened voluntary donors**, who register and respond; and **coordinators**, who use forecasts to plan stock.

## Verified access — the trust model (live in the product)

Trust is not a prototype here; it runs in production:

- **Two account types, JWT-authenticated** (bcrypt-hashed passwords): Hospital/Blood-Bank Staff and Donor.
- **Institution verification**: staff register with their institution name and license number, start as *pending*, and are approved or rejected by a verified admin in a built-in Verification Panel. Only approved staff can post requests.
- **Health screening at donor signup**: every donor answers an 8-question pre-screening (fever, HIV, hepatitis, chronic conditions, long-term medication, recent procedures, pregnancy, malaria travel). Answers become *staff-only safety flags* — visible to hospital staff during matching and donor responses, never to other donors.
- **Replacement donors**: verified staff can register walk-in donors brought by a patient's family, tagged with their institution, adding them to the matched pool.

## Privacy by default

Patient names never leave the staff side: the public feed and match views show only blood group, units, hospital, city and urgency. Staff record a private *internal reference* for their own records instead. Donor phone numbers are masked in the public directory and revealed only to the staff member who posted that specific request. All input validation, masking and eligibility rules live server-side, so they cannot be bypassed from the browser.

## The need and the impact

Every emergency that starts with an AI match instead of a phone tree saves the most expensive currency in medicine: time. In a live demo request, the system surfaced 10 ranked eligible donors in seconds while automatically blocking 14 others for being inside their resting window — each blocked donor is a medical complication that never happens. Newly registered donors are guaranteed visible in match results for their first 24 hours (badged "New Donor"), and match views re-rank live, so a compatible donor who signs up after a request is posted still appears immediately. The system closes its own data loop: confirmed fulfillments put donors into their resting windows, restock surplus units into hospital inventory, and feed real outcomes back into the forecast model — so it gets smarter with use.

## Innovation and technology

React 19 + Vite + Tailwind + Recharts frontend; Node.js/Express API with JWT authentication and role-based guards on both server and client; in-memory store with disk persistence and Mongoose-ready schemas for a MongoDB upgrade. Matching uses a blood-compatibility map (O- treated as the universal donor), haversine distance scoring with city-center fallbacks, and a weighted score (compatibility 40% · distance 30% · donation recency 20% · rating 10%), re-weighted toward distance for critical requests. Automated API smoke tests cover auth, signup, verification, matching (including the new-donor visibility guarantee) and privacy redaction. The app is deployed as a serverless production build on Vercel, with full source and history on GitHub.

## Feasibility — what we have actually built

Everything shown is real, deployed, and verifiable in minutes: open the live URL, log in as the seeded admin (03000000001 / admin123), post an emergency request, and watch the AI match with ineligible donors blocked and no patient name anywhere. Register as a donor to see the 8-question health screening. Or clone the repo, run `npm run install:all` and `npm run dev`, and the app seeds itself with 150 donors, 19 real hospitals and blood banks, and 90 days of demand history across six Pakistani cities. Bugs found in real testing — negative resting countdowns, patient-name leakage into match views, and new donors being silently excluded from matching — were each reproduced, fixed, and re-verified on the live deployment. We state our scope honestly: the prototype uses in-memory storage, so production still needs a real database and SMS alerts — and the roadmap for each is concrete.
