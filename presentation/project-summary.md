# BloodBridge AI — Project Summary

**Live product:** https://bloodbridge-ai-two.vercel.app
**Source code:** https://github.com/sana1234-tech/bloodbridge-AI
**Demo admin:** phone `03000000001` · password `admin123`

## The problem, and who it affects

When a patient in Pakistan needs blood urgently, their family enters a desperate phone tree — calling relatives, posting on Facebook and WhatsApp, and driving from one blood bank to another while the clock runs out. Three failures compound the crisis. First, matching is manual and slow: there is no single place where a verified medical need meets willing, *eligible* donors. Second, safety rules are ignored: Pakistan's blood transfusion guidelines require a 90-day rest between donations for men and 120 days for women, yet informal networks contact whoever answers the phone, regardless of eligibility — putting donors and patients at medical risk. Third, anyone can post anything: unverified requests circulate publicly with patient names and donor phone numbers attached, with no way to tell a genuine hospital need from spam, and privacy is traded away in the panic.

This affects patients in emergencies, childbirth, surgery and accidents; thalassemia and dialysis patients who need transfusions every 2–4 weeks for life (Pakistan carries one of the world's largest thalassemia burdens); hospitals and blood banks coordinating under time pressure with no forecasting; and voluntary donors who want to help safely.

## Our solution, and the audience it serves

BloodBridge AI is a working emergency blood coordination platform, deployed live, built around three coordinated systems.

**Safety-first donor matching.** A verified staff member posts an emergency request, and the system instantly ranks compatible donors by blood type (with O-negative treated as the universal donor), haversine distance, donation recency, and donor reliability. The critical difference: donors still inside the mandatory 90/120-day resting window are *hard-blocked* — excluded entirely, never just ranked lower — and the blocked count is displayed live on every match. Newly registered donors are guaranteed visible in results for their first 24 hours, badged "New Donor," and results re-rank live on every view, so a compatible donor who signs up after a request is posted still appears immediately.

**Self-verifying demand forecasts.** Seven-day predictions per city and blood group, built from a weighted 14-day moving average, linear-regression trend, and weekday seasonality. The model backtests itself daily against real demand — accuracy across 672 backtested forecasts, per city and blood group, is displayed live in the product. Proven, not claimed.

**An assistant chatbot** that answers compatibility, eligibility, and inventory questions instantly.

The platform serves **verified hospital and blood-bank staff**, who post requests; **screened voluntary donors**, who register and respond; and **coordinators**, who use forecasts to plan stock.

## The need it addresses, and the impact it makes

Every emergency that starts with an AI match instead of a phone tree saves the most expensive currency in medicine: time. In a live demo request, the system surfaced 10 ranked, medically eligible donors in seconds while automatically blocking 14 others inside their resting window — each blocked donor is a complication that never happens. Only verified institutions can ask the public for blood; every donor is health-screened before entering the pool; and patient identity never leaves the hospital. The system closes its own data loop: confirmed fulfillments put donors into their resting windows, restock surplus units into hospital inventory, and feed real outcomes back into the forecast model — so it gets smarter with use.

## Innovation and technology

**Trust is engineered, not assumed.** Two account types, JWT-authenticated with bcrypt-hashed passwords. Staff register with institution name and license number and start *pending*; a verified admin approves or rejects them in a built-in Verification Panel — only approved staff can post requests. Donors complete an 8-question health pre-screening at signup (fever, HIV, hepatitis, chronic conditions, medication, recent procedures, pregnancy, malaria travel); answers become safety flags visible to hospital staff only, never to other donors. Verified staff can also register walk-in replacement donors brought by a patient's family, tagged with their institution.

**Privacy by default.** Patient names never appear in public or donor-facing views — only blood group, units, hospital, city, and urgency. Staff record a private internal reference for their own records instead. Donor phone numbers are masked in the public directory and revealed only to the staff member who posted that specific request. All validation, masking, and eligibility rules live server-side and cannot be bypassed from the browser.

**Stack.** React 19 + Vite + Tailwind + Recharts frontend; Node.js/Express API; in-memory store with disk persistence and Mongoose-ready schemas for a MongoDB upgrade; deployed as a serverless production build on Vercel.

## Feasibility — what we have actually built

Everything above runs today, live on the internet. The full lifecycle works end-to-end: admin login → post request → AI match with ineligible donors blocked → donor responds with health screening on file → posting staff see contacts and safety flags → fulfillment confirmed → donors enter resting windows, inventory restocks, and the forecast learns. The app is seeded with 150 donors, 19 real hospitals and blood banks, and 90 days of demand history across six Pakistani cities. Real bugs found during testing — negative resting countdowns, patient-name leakage into match views, and new donors being silently excluded from matching — were each reproduced, fixed, and re-verified on the live deployment.

We state our scope honestly: the prototype uses in-memory storage, so full production still needs a real database and SMS/WhatsApp notifications. The roadmap for each is concrete.

**Every drop, matched in seconds. Safely.**
