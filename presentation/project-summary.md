# BloodBridge AI — Project Summary

*For judges — a 2-minute read before the presentation.*

**Live product:** https://bloodbridge-ai-two.vercel.app
**Source code:** https://github.com/sana1234-tech/bloodbridge-AI
**Demo admin:** phone `03000000001` · password `admin123`

---

## What it does

When a patient in Pakistan needs blood urgently, families burn hours in a phone tree — calling relatives, posting on Facebook, driving from bank to bank. BloodBridge AI replaces that with one platform: a **verified hospital staff member** posts an emergency request, and the system instantly ranks medically eligible, compatible donors by blood type, distance, donation recency, and reliability — while **hard-blocking anyone still inside the mandatory 90-day (men) / 120-day (women) resting window** per Pakistan Blood Transfusion Authority guidelines.

Donors see only what they need to decide — blood group, units, hospital, urgency. Patient identity stays private. And every request and fulfillment feeds a 7-day demand forecasting engine that backtests its own accuracy live in the product.

## Who it's for

- **Hospital and blood-bank staff** — post emergency requests, but only after registering with their institution details and being approved by a verified admin
- **Voluntary donors** — register with an 8-question health pre-screening, respond to nearby requests
- **The patients they serve** — emergencies, childbirth, surgery, accidents, and thalassemia patients who need a transfusion every 2–4 weeks for life

## What we built — working today in production

- **Full-stack app** (React 19 + Express, JWT authentication with bcrypt-hashed passwords), deployed live on Vercel
- **Two-role access control:** staff start *pending* and require admin approval in a built-in Verification Panel before they can post; donors register openly with health screening
- **8-question donor health screening** (fever, HIV, hepatitis, chronic conditions, medication, recent procedures, pregnancy, malaria travel) — answers become safety flags visible to staff only, never to other donors
- **AI matching** with O- universal-donor logic, haversine distance scoring with city-center fallbacks, the resting-window safety filter, and a 24-hour visibility guarantee so newly registered donors are never buried
- **Privacy by default:** patient names and donor phone numbers never exposed in public or donor-facing views; staff record a private internal reference instead
- **Self-verifying demand forecasts:** 7-day predictions per city and blood group, backtested at ~80–84% accuracy, displayed live in the Analytics page
- **Replacement-donor registration** (walk-in donors tagged with the registering institution), assistant chatbot, dashboard, and analytics
- **Field-hardened:** bugs found in real testing — negative resting countdowns, patient-name leakage into match views, and new donors being silently excluded from matching — were each reproduced, fixed, and re-verified on the live deployment

## Honest scope

The prototype uses in-memory storage (serverless deployments re-seed on cold start). Full production needs a real database and SMS/WhatsApp notifications — the roadmap for each is concrete.
