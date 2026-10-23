import { useState, useEffect } from 'react';
import { Users, MapPin, Star, Filter, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

const CITIES = ['', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];
const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function eligibilityLabel(eligibility) {
  if (!eligibility) return null;
  if (eligibility.eligible) return 'Eligible to donate';
  const days = eligibility.daysSinceLastDonation;
  if (eligibility.reason?.startsWith('Resting period') && days !== null) {
    return `Resting (${Math.max(0, eligibility.requiredGapDays - days)}d left)`;
  }
  return 'Not eligible';
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function Donors() {
  const [donors, setDonors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [available, setAvailable] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = { page, limit: 12 };
    if (city) params.city = city;
    if (bloodGroup) params.bloodGroup = bloodGroup;
    if (available) params.available = available;

    api.getDonors(params)
      .then((data) => {
        setDonors(data.donors);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, city, bloodGroup, available]);

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-red-600" />
          Donor Directory
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {total} registered donors across Pakistan
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="">All Cities</option>
            {CITIES.filter(Boolean).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={bloodGroup}
            onChange={(e) => { setBloodGroup(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.filter(Boolean).map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
          <select
            value={available}
            onChange={(e) => { setAvailable(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Donor Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading donors...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors.map((donor) => (
            <div key={donor._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 break-words">{donor.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 min-w-0">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{donor.area}, {donor.city}</span>
                  </div>
                </div>
                <span className="flex-shrink-0 bg-red-100 text-red-700 px-2.5 py-1 rounded-lg text-sm font-bold">
                  {donor.bloodGroup}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Star className="w-3 h-3 text-yellow-500" />
                  {donor.rating}/5
                </span>
                <span className="whitespace-nowrap">{donor.totalDonations} donations</span>
                <span className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                  donor.isAvailable ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {donor.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                {donor.eligibility && (
                  <span
                    className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                      donor.eligibility.eligible ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                    }`}
                    title={donor.eligibility.reason}
                  >
                    {eligibilityLabel(donor.eligibility)}
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-gray-400">
                  Last donated: {formatDate(donor.lastDonationDate)}
                </span>
                <span
                  className="text-gray-400 flex items-center gap-1 text-xs"
                  title="Phone numbers are masked for privacy — real contact details are only shared through the AI matching process for an active request."
                >
                  <ShieldCheck className="w-3 h-3" /> {donor.phone} · via AI match
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
