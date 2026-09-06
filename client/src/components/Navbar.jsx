import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Droplets, LayoutDashboard, AlertTriangle, Users, Building2, BarChart3, Activity, ShieldCheck, FileText, UserPlus, LogOut, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isVerifiedStaff, isPendingStaff, isDonor, logout } = useAuth();

  // Base nav items visible to everyone
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/donors', label: 'Donors', icon: Users },
    { path: '/hospitals', label: 'Hospitals', icon: Building2 },
    { path: '/analytics', label: 'AI Predictions', icon: BarChart3 },
  ];

  // Verified staff (admin) gets extra nav items
  if (isVerifiedStaff) {
    navItems.push({ path: '/request', label: 'Post Request', icon: AlertTriangle });
    navItems.push({ path: '/my-requests', label: 'My Requests', icon: FileText });
    navItems.push({ path: '/verification', label: 'Verification', icon: ShieldCheck });
    navItems.push({ path: '/replacement-donor', label: 'Add Donor', icon: UserPlus });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-red-100 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-red-600 text-white p-2 rounded-lg">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">BloodBridge AI</h1>
              <p className="text-xs text-gray-500 -mt-0.5">Emergency Coordination</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-medium text-gray-700">{user.fullName || user.role}</p>
                  <p className="text-[10px] text-gray-400">
                    {isVerifiedStaff ? 'Admin (Verified Staff)' : isPendingStaff ? 'Staff (Pending)' : 'Donor'}
                  </p>
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 px-2.5 py-1.5 rounded-full transition-colors">
                  <LogOut className="w-3 h-3" /> Logout
                </button>
              </div>
            ) : (
              <Link to="/login"
                className="flex items-center gap-1 text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full transition-colors font-medium">
                <LogIn className="w-3 h-3" /> Login
              </Link>
            )}
          </div>
        </div>

        {/* Pending verification banner */}
        {isPendingStaff && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Your institution is pending verification — you can browse but cannot post requests yet.
          </div>
        )}

        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto gap-1 pb-2 -mx-4 px-4">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-red-50 text-red-700'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
