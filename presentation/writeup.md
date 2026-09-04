# BloodBridge AI — Submission Write-up

**Category:** Healthcare · **Alibaba Cloud AI Hackathon Pakistan 2026**

## The problem, and who it affects

When a patient in Pakistan needs blood urgently, their family enters a desperate phone tree — calling relatives, posting on Facebook and WhatsApp, and driving from one blood bank to another while the clock runs out. Three failures compound the crisis. First, matching is manual and slow: there is no single place where a verified medical need meets willing, *eligible* donors. Second, safety rules are ignored: Pakistan's blood transfusion guidelines require a 90-day rest between donations for men and 120 days for women, yet informal networks contact whoever answers, regardless of eligibility. Third, blood banks operate blind: inventory decisions rest on instinct, so rare groups run out without warning — while donor phone numbers circulate publicly and get misused. This affects patients in emergencies and childbirth, thalassemia patients who need transfusions every few weeks for life, hospitals and blood banks coordinating under time pressure, and voluntary donors who want to help safely.

## Our solution, and who it serves

BloodBridge AI is a working emergency blood coordination platform built around three systems. **Safety-first donor matching** ranks compatible donors by blood type, distance, donation recency and reliability — and *hard-blocks* anyone still inside the mandatory 90/120-day resting window; ineligible donors are excluded entirely, never just ranked lower. **Self-verifying demand forecasts** predict 7 days of demand per city and blood group (weighted moving average + trend + weekday seasonality) — and the model is *backtested daily against real demand*, with its ~80–84% accuracy (112 forecasts) displayed live in the product. An **assistant chatbot** answers compatibility, eligibility and inventory questions instantly. The platform serves hospital and blood-bank staff, who post requests; voluntary donors, who register and respond; and coordinators, who use forecasts to plan stock.

## The need and the impact

Every emergency that starts with an AI match instead of a phone tree saves the most expensive currency in medicine: time. In a live demo request, the system surfaced 10 ranked eligible donors in seconds while automatically blocking 17 others for being inside their resting window — each blocked donor is a medical complication that never happens. The system enforces privacy by default (patient names masked as "M*** B***", donor phones masked in the public directory and revealed only through verified matching), and it closes its own data loop: confirmed fulfillments put donors into their resting windows, restock surplus units into hospital inventory, and feed real outcomes back into the forecast model — so it gets smarter with use.

## Innovation and technology

React 19 + Vite + Tailwind + Recharts frontend; Node.js/Express API; in-memory store with automatic disk persistence and Mongoose-ready schemas for a MongoDB upgrade. Input validation, PII masking and eligibility rules live server-side, so they cannot be bypassed from the browser. A 21-test automated API suite covers the full lifecycle (request → match → fulfill → backtest). A second standalone prototype demonstrates the production trust model: institution verification before posting, donor health self-screening, and private patient references.

## Feasibility — what we have actually built

Everything shown is real and reproducible: clone the repo, run `npm run install:all` and `npm run dev`, and the app seeds itself with 150 donors, 19 real hospitals and blood banks, and 90 days of demand history across six Pakistani cities. Submit a request, watch the AI match with ineligible donors blocked, confirm fulfillment, and watch donors enter their resting windows and the forecast learn. `node server/smoke-test.js` runs the full 21-test suite. We state our scope honestly: production deployment still needs authentication, SMS alerts and hospital system integration — and the roadmap for each is concrete.
