# BloodBridge AI — Demo Video Script (4–5 minutes)

> Recording tips at the bottom. Practice the flow once before recording.
> The demo runs on the LIVE site: https://bloodbridge-ai-two.vercel.app

---

## 0. Opening (15 sec)
Open the Dashboard (https://bloodbridge-ai-two.vercel.app).

> "This is BloodBridge AI — a live, deployed emergency blood coordination
> system for Pakistan. When a patient needs blood urgently, families waste
> hours calling relatives and blood banks. BloodBridge connects verified
> hospitals, blood banks, and screened donors in minutes — safely."

---

## 1. Login — verified access only (30 sec)
Click **Login** (top right).

- Select role **Hospital Staff**.
- Phone: `03000000001`, Password: `admin123`. Click **Sign In**.

> "Access is role-based and authenticated. Hospital staff register with their
> institution and license number, and start as *pending* — a verified admin
> must approve them before they can post any request. Unverified accounts
> can never ask the public for blood."

---

## 2. The Emergency Request flow (40 sec)
Click **Post Request** (navbar).

- Step 1: patient name `Demo Patient`, blood group **B+**, units **2**, urgency **Critical**.
- Step 2: city **Islamabad**, pick **Shifa International Hospital**.
- Step 3: contact `0300-1234567`, internal reference `BB-2026-001`, **Submit**.

> "An approved staff member posts a request in three guided steps. Every field
> is validated — blood groups, Pakistani phone formats, 1–20 units. The
> internal reference stays private to the hospital's own records."

---

## 3. AI Donor Matching — the safety story (60 sec)
The app auto-runs the AI match and opens the results page.

> "BloodBridge instantly ranks compatible donors. Matching scores blood-type
> compatibility — a B+ patient can receive from B and O donors; O-negative is
> the universal donor — plus distance, donation recency, and donor rating."

Point at the **"Blocked by Resting Window"** card (e.g. 14 donors).

> "But here's what makes it different: those people WANT to donate, and are
> compatible — but they donated recently. Pakistani guidelines require 90 days
> rest for men, 120 for women. BloodBridge hard-blocks them. No other app does
> this. Protecting donors is not optional."

Point at the header line.

> "Notice: no patient name appears here. Donors see only the blood group,
> units, hospital and urgency — the patient's identity stays with the hospital."

If a donor registered in the last 24 hours appears, point at the **"New Donor"** badge.

> "Newly registered donors are guaranteed visible in results for their first
> 24 hours, so a fresh signup is never buried — and results re-rank live."

---

## 4. Donor registration with health screening (40 sec)
Open a new incognito window at https://bloodbridge-ai-two.vercel.app/signup/donor (or log out first).

- Step 1: name `Sara Jutt`, phone `0321-5551234`, blood group **O-**, age `26`, city **Islamabad**, gender **Female**.
- Step 2: answer the 8 health screening questions, **Submit**.

> "Donors complete an 8-point health pre-screening at signup — fever, HIV,
> hepatitis, chronic conditions, medication, recent procedures, pregnancy,
> malaria travel. These become safety flags for hospital staff only. Donors
> never see each other's data."

---

## 5. Staff view — responses with safety flags (30 sec)
Back in the admin window, open **My Requests**, expand the request's donor responses.

> "When donors respond, the posting staff member sees their contact details —
> and their health and eligibility flags, right next to the phone number.
> Amber means caution: age outside 18–65, a screening answer, or a recent
> donation. Staff make the final call, with full information."

---

## 6. The Verification Panel (20 sec)
Click **Verification** (navbar).

> "This is the admin's verification queue. New staff signups wait here with
> their institution name and license number — one click approves or rejects.
> Trust is enforced by the product, not by hope."

---

## 7. Closing the loop (30 sec)
Back on the match page, check 2 donors, click **Mark Fulfilled**.

> "When blood is given, staff confirm which donors donated. Those donors
> automatically enter their resting window — they won't be matched again until
> it's safe. Surplus units restock the hospital's inventory. And real usage
> feeds our forecasting engine. The system learns from every donation."

---

## 8. Predictive Analytics (30 sec)
Open **Analytics**.

> "Blood banks usually plan by gut feeling. BloodBridge forecasts demand per
> city and blood group for the next 7 days — and we don't just claim it works:
> the model backtests itself against real history — the accuracy score is
> computed across 672 forecasts and shown live in the product."

---

## 9. Closing (15 sec)
Back to Dashboard.

> "BloodBridge AI — deployed live, verified staff, screened donors, privacy
> by default. The right donor, at the right distance, at the right time —
> safely. Thank you."

---

## Recording tips
- **Windows built-in recorder**: press **Win + G** (Xbox Game Bar) → Capture →
  Record (microphone ON). Or **Win + Alt + R** to start instantly.
- Resolution: record the browser fullscreen at 1920×1080 if possible.
- Demo the **live site** (bloodbridge-ai-two.vercel.app) — no local servers
  needed. For the two-window section (donor signup + admin view), use one
  normal window and one incognito window so both sessions stay logged in.
- Before recording: run through the flow once, register a fresh donor (so the
  "New Donor" badge shows on match results), then refresh.
- Speak slightly slower than feels natural; pause between sections.
- 4–5 minutes is ideal. If you stumble, pause 2 seconds and restart the
  sentence — easy to cut in editing (even the free Clipchamp app in Windows).

## Optional: run locally instead
```powershell
# Terminal 1 — API
cd server ; npm start
# Terminal 2 — web app
cd client ; npm run dev
# Then open http://localhost:5173
```
For a fresh seed, delete `server/data/bloodbridge-data.json` and restart the server.
