import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

export default function SignupStaff() {
  const navigate = useNavigate();
  const { signupStaff } = useAuth();
  const [form, setForm] = useState({
    fullName: '', phone: '', password: '',
    institutionName: '', institutionLicenseNo: '', city: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signupStaff(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-blue-600 px-6 py-5 text-white text-center">
            <UserPlus className="w-10 h-10 mx-auto mb-2" />
            <h1 className="text-xl font-bold">Hospital Staff Registration</h1>
            <p className="text-blue-100 text-sm mt-1">Register your institution to post blood requests</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={form.fullName} onChange={(e) => update('fullName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Dr. Ahmad Khan" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0300-1234567" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="At least 4 characters" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
              <input type="text" value={form.institutionName} onChange={(e) => update('institutionName', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Jinnah Hospital" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution Registration/License No.</label>
              <input type="text" value={form.institutionLicenseNo} onChange={(e) => update('institutionLicenseNo', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. REG-LHR-001" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select value={form.city} onChange={(e) => update('city', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                <option value="">Select city...</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-xs">
              Your account will be created with "pending verification" status. A verified staff member (admin) must approve your institution before you can post blood requests.
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Registering...' : <><UserPlus className="w-4 h-4" /> Register Institution</>}
            </button>

            <div className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-blue-600 hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
