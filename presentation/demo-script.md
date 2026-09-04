# BloodBridge AI — Demo Video Script (3–4 minutes)

> Recording tips at the bottom. Practice the flow once before recording.

---

## 0. Opening (15 sec)
Show the Dashboard (http://localhost:5173).

> "This is BloodBridge AI — an emergency blood coordination system for Pakistan.
> When a patient needs blood urgently, families waste hours calling relatives and
> blood banks. BloodBridge connects hospitals, blood banks, and eligible donors
> in minutes — safely."

---

## 1. The Emergency Request flow (45 sec)
Click **"New Request"** (top right).

- Step 1: type patient name `Muhammad Bilal`, select blood group **B+**, urgency **Critical**.
- Step 2: pick **Shaukat Khanum Memorial Hospital, Lahore**, units **2**.
- Step 3: contact `0300-1234567`, short note, **Submit**.

> "Any verified hospital staff member posts a request in three guided steps.
> Every field is validated — blood groups, Pakistani phone formats, 1–20 units."

---

## 2. AI Donor Matching — the safety story (60 sec)
From the request screen, click **Run AI Match**.

> "BloodBridge instantly ranks compatible donors. Matching scores blood-type
> compatibility — a B+ patient can receive from B and O donors — plus distance,
> donation recency, and donor rating."

Point at the **"17 donors excluded — resting window"** banner.

> "But here's what makes it different: these 17 people WANT to donate, and are
> compatible — but they donated recently. Pakistani guidelines require 90 days
> rest for men, 120 for women. BloodBridge hard-blocks them. No other app does
> this. Protecting donors is not optional."

Scroll the ranked list, show the masked phones (`03xx*******`).

> "Donor numbers are masked publicly — full contact is revealed only for an
> active matched request. Privacy by default."

---

## 3. Closing the loop (40 sec)
Check 2 donors, click **Mark Fulfilled**.

> "When blood is given, staff mark the request fulfilled. Notice what happens:
> those donors automatically enter their 90-day resting window — they won't be
> matched again until it's safe. Surplus units restock the hospital's inventory.
> And real usage feeds our forecasting engine. The system learns from every
> donation."

---

## 4. Predictive Analytics (40 sec)
Open **Analytics**.

> "Blood banks usually plan by gut feeling. BloodBridge forecasts demand per
> city and blood group for the next 7 days using weighted moving averages,
> trend regression, and weekday patterns."

Point at the accuracy badge.

> "And we don't just claim it works — the model backtests itself against real
> history: currently around 84% accuracy over 100+ forecasts. Verifiable, not
> vaporware."

---

## 5. The assistant chatbot (20 sec)
Click the chat bubble (bottom right). Ask: `Can I donate?`

> "A built-in assistant answers eligibility questions, guides donors, and
> explains blood compatibility — in plain language."

---

## 6. Mobile prototype + closing (30 sec)
Open `prototype/index.html` in a second browser tab (or resize the window).

> "A mobile companion prototype covers the trust model — verified staff
> onboarding, donor self-screening, and replacement-donor registration."

Back to Dashboard.

> "BloodBridge AI: the right donor, at the right distance, at the right time —
> safely. Built, tested, and working. Thank you."

---

## Recording tips
- **Windows built-in recorder**: press **Win + G** (Xbox Game Bar) → Capture →
  Record (microphone ON). Or **Win + Alt + R** to start instantly.
- Resolution: record the browser fullscreen at 1920×1080 if possible.
- Before recording: restart both servers, refresh the browser, run through the
  flow once, then reset data (Account tab in the prototype, or delete
  `server/data/bloodbridge-data.json` and restart the server for a fresh seed).
- Speak slightly slower than feels natural; pause between sections.
- 3–4 minutes is ideal. If you stumble, pause 2 seconds and restart the sentence
  — easy to cut in editing (even the free Clipchamp app in Windows).

## Start both servers (if not already running)
```powershell
# Terminal 1 — API
cd server ; npm start
# Terminal 2 — web app
cd client ; npm run dev
# Then open http://localhost:5173
```
