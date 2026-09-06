import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, ChevronRight, ChevronLeft, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];
const GENDERS = ['male', 'female', 'other'];

const HEALTH_QUESTIONS = [
  { key: 'fever', text: 'Do you currently have a fever, infection, or feel unwell?' },
  { key: 'hiv', text: 'Have you ever tested positive for HIV, or had known high-risk exposure?' },
  { key: 'hepatitis', text: 'Have you ever tested positive for Hepatitis B (HBsAg) or Hepatitis C?' },
  { key: 'chronic', text: 'Do you have a chronic condition (heart disease, kidney disease, or uncontrolled diabetes)?' },
  { key: 'medication', text: 'Are you currently on long-term medication (e.g. blood thinners)?' },
  { key: 'recentProcedure', text: 'Tattoo, piercing, or major dental work in the last 6 months?' },
  { key: 'pregnancy', text: 'Currently pregnant, or given birth in the last 6 months?' },
  { key: 'malariaTravel', text: 'Travelled to a malaria-affected area in the last 3 months?' },
];

export default function SignupDonor() {
  const navigate = useNavigate();
  const { signupDonor } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', phone: '', password: '', bloodGroup: '',
    age: '', city: '', area: '', gender: 'male', lastDonationDate: '',
  });
  const [screening, setScreening] = useState(
    Object.fromEntries(HEALTH_QUESTIONS.map((q) => [q.key, null]))
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const updateScreening = (key, value) => setScreening((p) => ({ ...p, [key]: value }));

  const canNextStep1 = form.name.trim().length >= 2 && form.phone && form.password.length >= 4
    && form.bloodGroup && form.city;
  const canNextStep2 = HEALTH_QUESTIONS.every((q) => screening[q.key] !== null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : null,
        lastDonationDate: form.lastDonationDate || undefined,
        ...screening,
      };
      await signupDonor(payload);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-green-600 px-6 py-5 text-white text-center">
            <UserPlus className="w-10 h-10 mx-auto mb-2" />
            <h1 className="text-xl font-bold">Donor Registration</h1>
            <p className="text-green-100 text-sm mt-1">Register to save lives</p>
          </div>

          {/* Progress */}
          <div className="px-6 py-3 bg-green-50 border-b border-green-100">
            <div className="flex items-center justify-between">
              {['Basic Details', 'Health Screening'].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= i + 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>{i + 1}</div>
                  <span className={`text-sm ${step >= i + 1 ? 'text-green-700 font-medium' : 'text-gray-500'}`}>{label}</span>
                  {i < 1 && <ChevronRight className="w-4 h-4 text-gray-300 ml-2" />}
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Your full name" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="0300-1234567" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="4+ characters" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_GROUPS.map((bg) => (
                      <button key={bg} type="button" onClick={() => update('bloodGroup', bg)}
                        className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
                          form.bloodGroup === bg ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>{bg}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input type="number" min="1" max="120" value={form.age} onChange={(e) => update('age', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="25" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select value={form.gender} onChange={(e) => update('gender', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none">
                      {GENDERS.map((g) => <option key={g} value={g} className="capitalize">{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <select value={form.city} onChange={(e) => update('city', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none">
                      <option value="">Select...</option>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation Date (optional)</label>
                  <input type="date" value={form.lastDonationDate} onChange={(e) => update('lastDonationDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>This is a pre-screening step only, not a medical clearance. Full screening happens in person at the blood bank before donation.</span>
                </div>

                <div className="space-y-3">
                  {HEALTH_QUESTIONS.map((q) => (
                    <div key={q.key} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 flex-1">{q.text}</span>
                      <div className="flex gap-2 flex-shrink-0">
                        <button type="button" onClick={() => updateScreening(q.key, true)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            screening[q.key] === true ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}>Yes</button>
                        <button type="button" onClick={() => updateScreening(q.key, false)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            screening[q.key] === false ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}>No</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {step < 2 ? (
                <button onClick={() => setStep(2)} disabled={!canNextStep1}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={loading || !canNextStep2}
                  className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  {loading ? 'Registering...' : <><UserPlus className="w-4 h-4" /> Complete Registration</>}
                </button>
              )}
            </div>

            <div className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-green-600 hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
