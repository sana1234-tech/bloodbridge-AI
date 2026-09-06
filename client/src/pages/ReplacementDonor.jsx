import { useState } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

export default function ReplacementDonor() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', bloodGroup: '', age: '', city: '', gender: 'male' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await api.registerReplacementDonor({
        ...form,
        age: form.age ? Number(form.age) : undefined,
      });
      setSuccess(result.message + ` (${result.donor?.name}, ${result.donor?.bloodGroup})`);
      setForm({ name: '', phone: '', bloodGroup: '', age: '', city: '', gender: 'male' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-purple-600 px-6 py-5 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Register Replacement Donor
          </h1>
          <p className="text-purple-100 text-sm mt-1">
            Register a donor brought in by a patient's family. They will be added to the general donor pool.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-3 rounded-lg text-xs">
            Institution: <strong>{user?.institutionName || 'Unknown'}</strong>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Full name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="0300-1234567" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" min="1" max="120" value={form.age} onChange={(e) => update('age', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="25" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button key={bg} type="button" onClick={() => update('bloodGroup', bg)}
                  className={`py-2.5 rounded-lg text-sm font-bold transition-all ${
                    form.bloodGroup === bg ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>{bg}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => update('gender', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select value={form.city} onChange={(e) => update('city', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none" required>
                <option value="">Select...</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? 'Registering...' : <><UserPlus className="w-4 h-4" /> Register Replacement Donor</>}
          </button>
        </form>
      </div>
    </div>
  );
}
