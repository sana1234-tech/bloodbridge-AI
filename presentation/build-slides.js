/* Generates presentation/slides.html - a self-contained slide deck with
 * screenshots embedded as base64. Run: node presentation/build-slides.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

function img(name) {
  const file = path.join(ASSETS, name);
  const b64 = fs.readFileSync(file).toString('base64');
  return `data:image/png;base64,${b64}`;
}

const IMG_DASHBOARD = img('dashboard.png');
const IMG_MATCH = img('donor-match.png');
const IMG_ANALYTICS = img('analytics.png');
const IMG_DONORS = img('donors.png');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BloodBridge AI — Presentation</title>
<style>
  :root{
    --red:#C31F2E; --red-dark:#8F1620; --red-50:#FDECEE;
    --teal:#0F766E; --teal-50:#E6F5F3;
    --amber:#B4740E; --amber-50:#FBF0DD;
    --ink:#1B1B1D; --ink-soft:#5B5B58; --ink-faint:#8B8B87;
    --line:#E7E5E0; --bg:#FFFFFF; --bg-soft:#FAFAF8;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  body{background:#2a2a2c; font-family:system-ui,-apple-system,'Segoe UI',sans-serif; color:var(--ink);}
  .deck{display:flex; flex-direction:column; align-items:center; gap:24px; padding:24px 0;}
  .slide{width:1280px; height:720px; background:var(--bg); position:relative; overflow:hidden;
    display:flex; flex-direction:column; padding:56px 64px; flex-shrink:0;}
  @media screen {
    .slide{box-shadow:0 8px 40px rgba(0,0,0,.5); display:none;}
    .slide.active{display:flex;}
    .hint{position:fixed; bottom:12px; left:50%; transform:translateX(-50%); color:#bbb; font-size:13px;
      background:rgba(0,0,0,.6); padding:6px 14px; border-radius:8px; z-index:99;}
  }
  @media print {
    body{background:#fff;}
    .deck{gap:0; padding:0;}
    .slide{display:flex !important; page-break-after:always; box-shadow:none;}
    .hint{display:none;}
    @page{size:1280px 720px; margin:0;}
  }
  .kicker{font-size:15px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:var(--red); margin-bottom:14px;}
  h1{font-size:64px; letter-spacing:-1.5px; line-height:1.05; font-weight:800;}
  h2{font-size:40px; letter-spacing:-.8px; line-height:1.1; font-weight:800; margin-bottom:8px;}
  .sub{font-size:20px; color:var(--ink-soft); line-height:1.5;}
  .accent{color:var(--red);}
  .grow{flex:1;}
  .cols{display:flex; gap:36px; flex:1; min-height:0; margin-top:28px;}
  .col{flex:1; min-width:0; display:flex; flex-direction:column;}
  .card{border:1.5px solid var(--line); border-radius:16px; padding:22px 24px; background:var(--bg-soft);}
  .card h3{font-size:20px; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:10px;}
  .card p{font-size:15.5px; color:var(--ink-soft); line-height:1.55;}
  .num{width:34px; height:34px; border-radius:10px; background:var(--red); color:#fff; display:flex;
    align-items:center; justify-content:center; font-size:17px; font-weight:800; flex-shrink:0;}
  .shot{border:1.5px solid var(--line); border-radius:14px; overflow:hidden; box-shadow:0 10px 30px rgba(27,27,29,.12);
    display:flex; align-items:center; justify-content:center; background:var(--bg-soft);}
  .shot img{width:100%; height:100%; object-fit:cover; object-position:top;}
  .pill{display:inline-block; font-size:14px; font-weight:700; padding:6px 14px; border-radius:20px;
    background:var(--red-50); color:var(--red-dark); margin:0 8px 8px 0;}
  .pill.teal{background:var(--teal-50); color:var(--teal);}
  .pill.amber{background:var(--amber-50); color:var(--amber);}
  .stat{flex:1; text-align:center; padding:20px 12px; border:1.5px solid var(--line); border-radius:16px; background:#fff;}
  .stat .v{font-size:44px; font-weight:800; color:var(--red); letter-spacing:-1px;}
  .stat .l{font-size:14px; color:var(--ink-soft); margin-top:6px; line-height:1.4;}
  .foot{position:absolute; bottom:22px; left:64px; right:64px; display:flex; justify-content:space-between;
    font-size:13px; color:var(--ink-faint);}
  .flow{display:flex; align-items:stretch; gap:0; margin-top:8px;}
  .fbox{flex:1; border:1.5px solid var(--line); border-radius:12px; padding:14px 12px; text-align:center; background:#fff;}
  .fbox b{font-size:15.5px; display:block; margin-bottom:4px;}
  .fbox span{font-size:12.5px; color:var(--ink-soft); line-height:1.4; display:block;}
  .farrow{display:flex; align-items:center; padding:0 7px; color:var(--red); font-size:22px; font-weight:800;}
  ul.tick{list-style:none;}
  ul.tick li{font-size:16.5px; color:var(--ink-soft); line-height:1.5; padding-left:30px; position:relative; margin-bottom:12px;}
  ul.tick li::before{content:'✓'; position:absolute; left:0; top:0; color:var(--teal); font-weight:800; font-size:17px;}
  ul.tick li b{color:var(--ink);}
  .titlebar{width:8px; position:absolute; left:0; top:0; bottom:0; background:linear-gradient(180deg,var(--red),var(--red-dark));}
</style>
</head>
<body>
<div class="hint">← → arrow keys to navigate · Ctrl+P → “Save as PDF”, margins: none, background graphics: on</div>
<div class="deck" id="deck">

  <!-- 1 · TITLE -->
  <section class="slide active">
    <div class="titlebar"></div>
    <div class="grow"></div>
    <div class="kicker">Alibaba Cloud AI Hackathon Pakistan 2026 · Healthcare</div>
    <h1>Blood<span class="accent">Bridge</span> AI</h1>
    <p class="sub" style="font-size:26px; margin-top:14px;">Emergency blood coordination for Pakistan —<br>every drop, matched in seconds. Safely.</p>
    <div style="margin-top:26px;">
      <span class="pill">Safety-first donor matching</span>
      <span class="pill teal">Self-verifying demand forecasts</span>
      <span class="pill amber">Privacy by default</span>
    </div>
    <div class="grow"></div>
    <p class="sub" style="font-size:16px; color:var(--ink-faint);">Team BloodBridge — working product, seeded with 6 cities across Pakistan</p>
  </section>

  <!-- 2 · PROBLEM -->
  <section class="slide">
    <div class="titlebar"></div>
    <div class="kicker">The problem · who it affects</div>
    <h2>Finding blood in an emergency means<br><span class="accent">hours of desperate phone calls.</span></h2>
    <div class="cols">
      <div class="col" style="flex:1.25;">
        <div class="card" style="margin-bottom:16px;">
          <h3><span class="num">1</span> Matching is slow and manual</h3>
          <p>Families call relatives, post on Facebook, and drive from bank to bank — while the patient's clock runs out. There is no single place where a verified need meets willing, <b>eligible</b> donors.</p>
        </div>
        <div class="card" style="margin-bottom:16px;">
          <h3><span class="num">2</span> Safety rules get ignored</h3>
          <p>Donors are contacted even when they are medically ineligible to donate again. Pakistan's guideline requires a 90-day rest for men and 120 for women — informal networks don't check.</p>
        </div>
        <div class="card">
          <h3><span class="num">3</span> Blood banks can't see demand coming</h3>
          <p>Inventory decisions are made on instinct. Rare groups run out without warning — while donor phone numbers circulate publicly and get misused.</p>
        </div>
      </div>
      <div class="col">
        <div class="card" style="flex:1; background:var(--red-50); border-color:#F0C7CB;">
          <h3 style="color:var(--red-dark);">Who lives this problem</h3>
          <p style="margin-bottom:14px;"><b>Patients &amp; families</b> — emergencies, childbirth, surgery, accidents.</p>
          <p style="margin-bottom:14px;"><b>Thalassemia &amp; dialysis patients</b> — Pakistan carries one of the world's largest thalassemia burdens; many need a transfusion every 2–4 weeks, for life.</p>
          <p style="margin-bottom:14px;"><b>Hospitals &amp; blood banks</b> — coordinating under time pressure with no forecasting.</p>
          <p><b>Voluntary donors</b> — willing to help, but contacted chaotically and without eligibility checks.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 3 · SOLUTION -->
  <section class="slide">
    <div class="titlebar"></div>
    <div class="kicker">Our solution · and who it serves</div>
    <h2>One platform, three coordinated systems.</h2>
    <div class="cols">
      <div class="col" style="flex:1.1;">
        <div class="card" style="margin-bottom:14px;">
          <h3><span class="num">1</span> Safety-first donor matching</h3>
          <p>Ranks compatible donors by blood type, distance, donation recency and reliability — and <b>hard-blocks anyone inside the mandatory resting window</b>.</p>
        </div>
        <div class="card" style="margin-bottom:14px;">
          <h3><span class="num">2</span> Self-verifying demand forecasts</h3>
          <p>7-day predictions per city &amp; blood group — with <b>backtested accuracy displayed live in the product</b>, so the numbers are proven, not claimed.</p>
        </div>
        <div class="card">
          <h3><span class="num">3</span> Assistant chatbot</h3>
          <p>Instant answers on compatibility, eligibility rules, live inventory and how to submit a request.</p>
        </div>
        <p class="sub" style="font-size:14.5px; margin-top:16px;"><b>Audience:</b> hospital &amp; blood-bank staff post verified requests · voluntary donors register and respond · coordinators forecast and plan stock.</p>
      </div>
      <div class="col">
        <div class="shot" style="flex:1;"><img src="${IMG_DASHBOARD}" alt="BloodBridge AI dashboard"></div>
        <p class="sub" style="font-size:13px; color:var(--ink-faint); margin-top:8px; text-align:center;">Live dashboard — inventory, donors by city, requests (patient names masked)</p>
      </div>
    </div>
  </section>

  <!-- 4 · NEED & IMPACT -->
  <section class="slide">
    <div class="titlebar"></div>
    <div class="kicker">The need · the impact it makes</div>
    <h2>From a phone tree to a <span class="accent">match in seconds</span> — with safety enforced by design.</h2>
    <div class="cols" style="align-items:stretch;">
      <div class="stat"><div class="v">10</div><div class="l">ranked, medically eligible donors surfaced instantly per request — ranked by compatibility, distance &amp; ETA</div></div>
      <div class="stat"><div class="v">17</div><div class="l">donors automatically blocked in one live demo request for being inside the 90/120-day resting window</div></div>
      <div class="stat"><div class="v">7 days</div><div class="l">of demand forecast per city &amp; blood group, with shortage warnings before banks run dry</div></div>
      <div class="stat"><div class="v">0</div><div class="l">patient names or donor phone numbers exposed in public views — masked by default</div></div>
    </div>
    <div class="card" style="margin-top:22px; background:var(--teal-50); border-color:#BFE3DF;">
      <p style="color:#0B4A44;"><b>Why it matters:</b> every emergency that starts with a match instead of a phone tree saves the most expensive currency in medicine — time. And every blocked ineligible donor is a complication that never happens. The system also gets <b>smarter with use</b>: real requests and fulfillments feed the forecast model.</p>
    </div>
  </section>

  <!-- 5 · INNOVATION 1 -->
  <section class="slide">
    <div class="titlebar"></div>
    <div class="kicker">Innovation 1 · safety-first matching</div>
    <h2>Matching that <span class="accent">refuses</span> to recommend ineligible donors.</h2>
    <div class="cols">
      <div class="col" style="flex:1.25;">
        <div class="shot" style="flex:1;"><img src="${IMG_MATCH}" alt="AI donor match results"></div>
      </div>
      <div class="col">
        <div class="card" style="margin-bottom:14px;">
          <h3>Weighted compatibility score</h3>
          <p>Blood-type compatibility (40%) · haversine distance (30%) · donation recency (20%) · donor rating (10%). Critical requests re-weight toward distance.</p>
        </div>
        <div class="card" style="margin-bottom:14px; background:var(--amber-50); border-color:#EBD6A8;">
          <h3 style="color:var(--amber);">The hard safety rule</h3>
          <p style="color:#7A5008;">Donors inside the 90-day (men) / 120-day (women) resting window are <b>excluded entirely</b> — never just ranked lower. The count is shown live on every match ("Blocked by Resting Window").</p>
        </div>
        <div class="card">
          <h3>Closing the loop</h3>
          <p>When staff confirm which donors actually donated, those donors automatically enter their resting window — the system keeps itself medically honest.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 6 · INNOVATION 2 -->
  <section class="slide">
    <div class="titlebar"></div>
    <div class="kicker">Innovation 2 · self-verifying forecasts</div>
    <h2>Predictions that <span class="accent">prove their own accuracy.</span></h2>
    <div class="cols">
      <div class="col" style="flex:1.25;">
        <div class="shot" style="flex:1;"><img src="${IMG_ANALYTICS}" alt="Analytics demand forecast"></div>
      </div>
      <div class="col">
        <div class="card" style="margin-bottom:14px;">
          <h3>The model</h3>
          <p>Weighted 14-day moving average + linear-regression trend + weekday seasonality, per city and blood group — explainable by design.</p>
        </div>
        <div class="card" style="margin-bottom:14px; background:var(--teal-50); border-color:#BFE3DF;">
          <h3 style="color:var(--teal);">Backtested, not just claimed</h3>
          <p style="color:#0B4A44;">The model is re-run on past days using only prior history, then compared with what actually happened — <b>~80–84% accuracy across 112 forecasts</b>, displayed live in the product.</p>
        </div>
        <div class="card">
          <h3>Learns from reality</h3>
          <p>Every real request and fulfillment updates demand history — the forecast improves as the system is used, instead of living on seed data.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 7 · INNOVATION 3 -->
  <section class="slide">
    <div class="titlebar"></div>
    <div class="kicker">Innovation 3 · closed loop &amp; privacy</div>
    <h2>A data loop that keeps the system truthful — <span class="accent">and privacy by default.</span></h2>
    <div class="flow" style="margin-top:20px;">
      <div class="fbox"><b>Blood request</b><span>validated: blood group, units 1–20, PK phone format, real hospital</span></div>
      <div class="farrow">→</div>
      <div class="fbox"><b>AI match</b><span>eligible donors ranked; ineligible ones hard-blocked</span></div>
      <div class="farrow">→</div>
      <div class="fbox"><b>Transfusion</b><span>staff call matched donors — full numbers only here</span></div>
      <div class="farrow">→</div>
      <div class="fbox"><b>Fulfillment confirmed</b><span>donors enter resting window · surplus restocks the bank · demand history updated</span></div>
    </div>
    <div class="cols" style="margin-top:22px;">
      <div class="col">
        <div class="card" style="flex:1;">
          <h3>Privacy by default</h3>
          <ul class="tick" style="margin-top:6px;">
            <li>Patient names masked everywhere public: <b>“M*** B***”</b> — contact numbers never returned</li>
            <li>Donor phones masked in the directory: <b>0335•••••••</b> — real numbers revealed only through the AI match for an active request</li>
            <li>All inputs validated at the API boundary — malformed or malicious data is rejected with clear errors</li>
          </ul>
        </div>
      </div>
      <div class="col">
        <div class="card" style="flex:1; background:var(--red-50); border-color:#F0C7CB;">
          <h3 style="color:var(--red-dark);">Trust model (mobile prototype)</h3>
          <ul class="tick" style="margin-top:6px;">
            <li>Only <b>verified hospital / blood-bank staff</b> can post requests — institutions submit registration numbers</li>
            <li>Donors complete an <b>8-point health self-screening</b> (re-screened in person at the bank, as required)</li>
            <li>Patient identity replaced by a private internal reference on the shared feed</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- 8 · TECHNOLOGY -->
  <section class="slide">
    <div class="titlebar"></div>
    <div class="kicker">The technology</div>
    <h2>Simple stack, engineered honestly.</h2>
    <div class="cols">
      <div class="col">
        <div class="card" style="margin-bottom:16px;">
          <h3>Architecture</h3>
          <p><b>React 19 + Vite + Tailwind + Recharts</b> single-page app → <b>Node.js / Express</b> API → in-memory store with <b>automatic disk persistence</b> (survives restarts; Mongoose-ready schemas for a MongoDB upgrade).</p>
        </div>
        <div class="card" style="margin-bottom:16px;">
          <h3>Quality engineering</h3>
          <p><b>21-test automated API suite</b> covering the full lifecycle (request → match → fulfill → backtest) — all passing. Input validation, masking and eligibility live on the <b>server side</b>, so the rules can't be bypassed from the browser.</p>
        </div>
        <div class="card">
          <h3>Realistic dataset</h3>
          <p>150 donors, 19 real hospitals &amp; blood banks, 90 days of demand history across Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad and Multan.</p>
        </div>
      </div>
      <div class="col">
        <div class="shot" style="flex:1;"><img src="${IMG_DONORS}" alt="Donor directory with masked phones and eligibility chips"></div>
        <p class="sub" style="font-size:13px; color:var(--ink-faint); margin-top:8px; text-align:center;">Donor directory — masked phones, live eligibility status per donor</p>
      </div>
    </div>
  </section>

  <!-- 9 · FEASIBILITY -->
  <section class="slide">
    <div class="titlebar"></div>
    <div class="kicker">Feasibility · what we actually built</div>
    <h2>Everything in this deck <span class="accent">runs today</span>, from the repo.</h2>
    <div class="cols">
      <div class="col">
        <ul class="tick" style="margin-top:8px;">
          <li><b>Full working app</b> — 6 pages, 10+ API endpoints, chatbot, live matching &amp; forecasting; two commands to run locally (<b>npm run install:all</b>, <b>npm run dev</b>)</li>
          <li><b>Complete request lifecycle</b> — create → AI match → call donors → confirm fulfillment → donors rest, bank restocks, model learns</li>
          <li><b>Tested end-to-end</b> — 21 automated API tests, all passing, included in the repo</li>
          <li><b>Second working prototype</b> — the mobile trust model (role onboarding, institution verification, donor screening) runs standalone in any browser</li>
          <li><b>Honest scope</b> — prototype persistence is JSON-on-disk; production needs auth, SMS alerts and hospital integration. We say so in the README — and the roadmap is concrete.</li>
        </ul>
      </div>
      <div class="col" style="flex:0.9;">
        <div class="card" style="flex:1; background:var(--teal-50); border-color:#BFE3DF;">
          <h3 style="color:var(--teal);">Judges can verify in 2 minutes</h3>
          <ol style="font-size:15.5px; color:#0B4A44; line-height:1.7; padding-left:20px; margin-top:8px;">
            <li>Clone the repo, run two commands</li>
            <li>Submit a request in the UI</li>
            <li>Watch the AI match — with ineligible donors blocked</li>
            <li>Check Analytics — accuracy is backtested, live</li>
            <li>Run <b>node server/smoke-test.js</b> — 21 green checks</li>
          </ol>
        </div>
      </div>
    </div>
  </section>

  <!-- 10 · CLOSE -->
  <section class="slide">
    <div class="titlebar"></div>
    <div class="grow"></div>
    <div class="kicker">Roadmap &amp; close</div>
    <h2>Next: SMS/WhatsApp alerts, map view,<br>blood-unit expiry tracking, MongoDB + auth.</h2>
    <p class="sub" style="margin-top:14px;">The coordinates, eligibility data and forecast loop are already in place — the roadmap builds on what runs today, not on promises.</p>
    <div class="grow"></div>
    <h1 style="font-size:52px;">Every drop, matched in seconds. <span class="accent">Safely.</span></h1>
    <div class="grow"></div>
    <p class="sub" style="font-size:17px; color:var(--ink-faint);">BloodBridge AI — Alibaba Cloud AI Hackathon Pakistan 2026 · Healthcare · Thank you</p>
  </section>

</div>
<script>
  const slides=[...document.querySelectorAll('.slide')];
  let i=0;
  function show(n){i=Math.max(0,Math.min(slides.length-1,n));slides.forEach((s,k)=>s.classList.toggle('active',k===i));}
  addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown')show(i+1);
    if(e.key==='ArrowLeft'||e.key==='PageUp')show(i-1);
  });
  addEventListener('click',e=>{ if(e.clientX>innerWidth/2)show(i+1); else show(i-1); });
</script>
</body>
</html>`;

const out = path.join(__dirname, 'slides.html');
fs.writeFileSync(out, html);
console.log('Wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB,', slides = html.match(/<section/g).length, 'slides');
