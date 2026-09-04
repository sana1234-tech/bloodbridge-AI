import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, Droplets, AlertTriangle, TrendingUp,
  Activity, MapPin, Clock, ChevronRight, Heart,
} from 'lucide-react';
import { api } from '../services/api';

const BLOOD_COLORS = {
  'A+': '#e74c3c', 'A-': '#c0392b', 'B+': '#e67e22', 'B-': '#d35400',
  'AB+': '#9b59b6', 'AB-': '#8e44ad', 'O+': '#3498db', 'O-': '#2980b9',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-red-600 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) return <div className="text-center text-red-500 py-10">Failed to load dashboard</div>;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="w-6 h-6" />
              BloodBridge AI Dashboard
            </h1>
            <p className="text-red-100 mt-1">
              Real-time blood coordination across Pakistan
            </p>
          </div>
          <Link
            to="/request"
            className="bg-white text-red-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center gap-2 self-start"
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency Request
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Donors" value={stats.totalDonors} color="blue" />
        <StatCard icon={Activity} label="Available Now" value={stats.availableDonors} color="green" />
        <StatCard icon={Building2} label="Hospitals & Banks" value={stats.totalHospitals} color="purple" />
        <StatCard icon={AlertTriangle} label="Active Requests" value={stats.activeRequests} color="red" badge={stats.criticalRequests > 0 ? `${stats.criticalRequests} critical` : null} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Blood Inventory Overview */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-red-500" />
            Blood Inventory (All Banks)
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(stats.totalInventory || {}).map(([bg, units]) => (
              <div key={bg} className="text-center">
                <div
                  className="text-2xl font-bold rounded-lg py-2 text-white"
                  style={{ backgroundColor: BLOOD_COLORS[bg] }}
                >
                  {units}
                </div>
                <p className="text-xs text-gray-500 mt-1 font-medium">{bg}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Total: {Object.values(stats.totalInventory || {}).reduce((s, v) => s + v, 0)} units
            </span>
            <Link to="/hospitals" className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
              View details <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Donors by City */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Donors by City
          </h2>
          <div className="space-y-3">
            {(stats.donorsByCity || []).map(({ _id, count, available }) => (
              <div key={_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{_id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {available} available
                  </span>
                  <span className="text-sm text-gray-500">{count} total</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Link to="/donors" className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
              View all donors <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-red-500" />
          Recent Blood Requests
        </h2>
        {stats.recentRequests && stats.recentRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Patient</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Blood Group</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Hospital</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Urgency</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRequests.map((req) => (
                  <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-2 font-medium text-gray-800">{req.patientName}</td>
                    <td className="py-2.5 px-2">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">
                        {req.bloodGroup}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-gray-600">{req.hospitalId?.name || 'N/A'}</td>
                    <td className="py-2.5 px-2">
                      <UrgencyBadge level={req.urgencyLevel} />
                    </td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-2.5 px-2">
                      {req.status === 'pending' && (
                        <Link
                          to={`/match/${req._id}`}
                          className="text-red-600 hover:text-red-700 text-xs font-medium"
                        >
                          Run AI Match
                        </Link>
                      )}
                      {req.status === 'matched' && (
                        <Link
                          to={`/match/${req._id}`}
                          className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          View Match
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-4 text-center">No recent requests</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <QuickAction
          to="/request"
          icon={AlertTriangle}
          title="New Emergency Request"
          desc="Submit a blood request and get AI-matched donors instantly"
          color="red"
        />
        <QuickAction
          to="/analytics"
          icon={TrendingUp}
          title="AI Demand Predictions"
          desc="View 7-day blood demand forecasts by city"
          color="blue"
        />
        <QuickAction
          to="/donors"
          icon={Users}
          title="Donor Directory"
          desc="Search and filter registered blood donors"
          color="green"
        />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, badge }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]} mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {badge && (
        <span className="inline-block mt-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function UrgencyBadge({ level }) {
  const styles = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[level] || ''}`}>
      {level}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-gray-100 text-gray-600',
    matched: 'bg-blue-100 text-blue-700',
    fulfilled: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status] || ''}`}>
      {status}
    </span>
  );
}

function QuickAction({ to, icon: Icon, title, desc, color }) {
  const colorMap = {
    red: 'hover:border-red-200 hover:bg-red-50',
    blue: 'hover:border-blue-200 hover:bg-blue-50',
    green: 'hover:border-green-200 hover:bg-green-50',
  };

  return (
    <Link
      to={to}
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 transition-all ${colorMap[color]}`}
    >
      <Icon className="w-6 h-6 text-gray-400 mb-2" />
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </Link>
  );
}
