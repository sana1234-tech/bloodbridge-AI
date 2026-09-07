BloodBridge AI is a live, deployed emergency blood coordination platform for Pakistan. When a patient needs blood urgently, families waste hours on phone trees and social media, ineligible donors get contacted, and patient privacy is traded away in the panic.

Our solution: verified hospital staff post emergency requests, and the system instantly ranks compatible, medically eligible donors by blood type, distance, donation recency and reliability, while hard-blocking anyone inside the mandatory 90/120-day resting window. Donors see only blood group, units, hospital and urgency; patient names never leave the hospital. Every fulfilled request feeds a 7-day demand forecast that backtests itself live (accuracy shown in the product).

Built on React 19 + Node.js/Express with JWT authentication, bcrypt-hashed passwords, role-based verification (staff start pending until an admin approves), 8-question donor health screening, and privacy-by-default phone masking. Deployed on Vercel with the full lifecycle working end-to-end: post request, AI match with ineligible donors blocked, donor responds, fulfillment confirmed, donors enter resting windows, inventory restocks, and the forecast learns.

It serves hospitals, blood banks, donors and coordinators, seeded with 150 donors and 19 hospitals across six Pakistani cities.

Live: https://bloodbridge-ai-two.vercel.app
Code: https://github.com/sana1234-tech/bloodbridge-AI
