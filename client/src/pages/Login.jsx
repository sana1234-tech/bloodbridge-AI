import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Phone, Lock, Droplets } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ phone: '', password: '', role: 'staff' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(form.phone, form.password, form.role);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-red-600 px-6 py-5 text-white text-center">
            <Droplets className="w-10 h-10 mx-auto mb-2" />
            <h1 className="text-xl font-bold">BloodBridge AI</h1>
            <p className="text-red-100 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['staff', 'donor'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: r }))}
                    className={`py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                      form.role === r
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {r === 'staff' ? 'Hospital Staff' : 'Donor'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="0300-1234567"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : <><LogIn className="w-4 h-4" /> Sign In</>}
            </button>

            <div className="text-center text-sm text-gray-500 pt-2">
              Don't have an account?{' '}
              {form.role === 'staff' ? (
                <Link to="/signup/staff" className="text-red-600 hover:underline font-medium">Register as Staff</Link>
              ) : (
                <Link to="/signup/donor" className="text-red-600 hover:underline font-medium">Register as Donor</Link>
              )}
            </div>

            {form.role === 'staff' && (
              <p className="text-xs text-center text-gray-400 mt-2">
                Demo admin: 03000000001 / admin123
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
