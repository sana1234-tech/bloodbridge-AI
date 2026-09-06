import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { MapPin, Clock, Star, Phone, Droplets, Loader2, Zap, Users, ArrowLeft, CheckCircle2, ShieldCheck, Flag, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DonorMatch() {
  const { requestId } = useParams();
  const location = useLocation();
  const { isVerifiedStaff } = useAuth();
  const [data, setData] = useState(location.state?.matchResult || null);
  const [loading, setLoading] = useState(!data);
  const [requestStatus, setRequestStatus] = useState('matched');
  const [donatedIds, setDonatedIds] = useState(new Set());
  const [fulfilling, setFulfilling] = useState(false);
  const [fulfillError, setFulfillError] = useState(null);
  const [fulfillSummary, setFulfillSummary] = useState(null);

  const toggleDonated = (donorKey) => {
    setDonatedIds((prev) => {
      const next = new Set(prev);
      if (next.has(donorKey)) next.delete(donorKey);
      else next.add(donorKey);
      return next;
    });
  };

  const handleFulfill = async () => {
    setFulfilling(true);
    setFulfillError(null);
    try {
      const result = await api.fulfillRequest(requestId, [...donatedIds]);
      setRequestStatus('fulfilled');
      setFulfillSummary(result.summary);
    } catch (err) {
      setFulfillError(err.message);
    } finally {
      setFulfilling(false);
    }
  };

  useEffect(() => {
    if (!data) {
      api.getMatchResults(requestId)
        .then((result) => {
          // Transform the match results for display
          setData({
            request: result.request,
            matches: result.matchedDonors?.map((md) => ({
              id: md.donorId?._id || md.donorId,
              name: md.donorId?.name || 'Unknown',
              bloodGroup: md.donorId?.bloodGroup || 'N/A',
              phone: md.donorId?.phone || 'N/A',
              city: md.donorId?.city || 'N/A',
              area: md.donorId?.area || 'N/A',
              matchScore: md.matchScore,
              distance: md.distance,
              rating: md.donorId?.rating || 0,
            })) || [],
            totalCompatible: result.matchedDonors?.length || 0,
          });
          setRequestStatus(result.status || 'matched');
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [requestId, data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        <p className="text-red-600 font-medium">AI is matching donors...</p>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-red-500 py-10">Match results not found</div>;
  }

  const { request, matches, totalCompatible } = data;

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Request Summary */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              AI Donor Match Results
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Hospital: <span className="font-medium text-gray-700">{request?.hospital}</span>
              {request?.hospitalArea && <span> · <span className="font-medium text-gray-700">{request.hospitalArea}</span></span>}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{request?.bloodGroup}</div>
              <p className="text-xs text-gray-500">Blood Group</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{request?.unitsNeeded}</div>
              <p className="text-xs text-gray-500">Units</p>
            </div>
            <div className="text-center">
              <div className={`text-sm font-bold px-3 py-1 rounded-full capitalize ${
                request?.urgencyLevel === 'critical' ? 'bg-red-100 text-red-700' :
                request?.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {request?.urgencyLevel}
              </div>
              <p className="text-xs text-gray-500 mt-1">Urgency</p>
            </div>
            <div className="text-center">
              <div className={`text-sm font-bold px-3 py-1 rounded-full capitalize ${
                requestStatus === 'fulfilled' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {requestStatus}
              </div>
              <p className="text-xs text-gray-500 mt-1">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
          <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-700">{matches?.length || 0}</p>
          <p className="text-xs text-green-600">Top Matches</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
          <Droplets className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-700">{totalCompatible || 0}</p>
          <p className="text-xs text-blue-600">Compatible Donors</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
          <Star className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-purple-700">
            {matches?.length > 0 ? Math.max(...matches.map((m) => m.matchScore)) : 0}%
          </p>
          <p className="text-xs text-purple-600">Best Match</p>
        </div>
        <div
          className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100"
          title="Donors blocked by the mandatory 90/120-day resting window between donations — a hard safety filter, not a ranking penalty."
        >
          <ShieldCheck className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-700">{data?.excludedByEligibility ?? '—'}</p>
          <p className="text-xs text-amber-600">Blocked by Resting Window</p>
        </div>
      </div>

      {/* Fulfillment — closes the data loop */}
      {requestStatus !== 'fulfilled' && matches?.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Confirm Fulfillment
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            After the transfusion, tick the donors who actually donated and close this request.
            They enter their 90/120-day resting window, demand history is updated, and any surplus
            units restock the hospital's blood bank.
          </p>
          <div className="space-y-2">
            {matches.map((donor) => {
              const key = donor.id || donor.donorId;
              return (
                <label key={key || donor.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={donatedIds.has(key)}
                    onChange={() => toggleDonated(key)}
                    className="w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm font-medium text-gray-800 flex-1">{donor.name}</span>
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">{donor.bloodGroup}</span>
                  <span className="text-xs text-gray-500">{donor.matchScore}%</span>
                </label>
              );
            })}
          </div>
          {fulfillError && (
            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {fulfillError}
            </div>
          )}
          <button
            onClick={handleFulfill}
            disabled={fulfilling}
            className="mt-4 w-full bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {fulfilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {fulfilling
              ? 'Saving...'
              : `Mark as Fulfilled${donatedIds.size > 0 ? ` (${donatedIds.size} donor${donatedIds.size > 1 ? 's' : ''} donated)` : ''}`}
          </button>
        </div>
      )}

      {requestStatus === 'fulfilled' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-800">Request fulfilled</h3>
            <p className="text-sm text-green-700 mt-1">
              {fulfillSummary
                ? `${fulfillSummary.donorsDonated} donor(s) donated. ` +
                  (fulfillSummary.surplusUnitsRestocked > 0
                    ? `${fulfillSummary.surplusUnitsRestocked} surplus unit(s) restocked at the hospital. `
                    : '') +
                  'Demand history updated — predictions now learn from this real outcome.'
                : 'This request has been fulfilled. Donors who donated are now in their resting window.'}
            </p>
          </div>
        </div>
      )}

      {/* Matched Donors List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Ranked Donor Matches</h2>
          <p className="text-xs text-gray-500 mt-0.5">Sorted by AI compatibility score</p>
        </div>
        <div className="divide-y divide-gray-50">
          {matches?.map((donor, idx) => (
            <div key={idx} className="px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                }`}>
                  {idx + 1}
                </div>

                {/* Donor Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{donor.name}</h3>
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">
                      {donor.bloodGroup}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {donor.area}, {donor.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {donor.etaMinutes || '~'} min ETA
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" /> {donor.rating || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Score & Actions */}
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    donor.matchScore >= 80 ? 'text-green-600' : donor.matchScore >= 60 ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {donor.matchScore}%
                  </div>
                  <p className="text-xs text-gray-500">{donor.distance} km</p>
                </div>

                {requestStatus !== 'fulfilled' && (
                  <a
                    href={`tel:${donor.phone}`}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                    title={`Call ${donor.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Score Bar */}
              <div className="mt-2 ml-12">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      donor.matchScore >= 80 ? 'bg-green-500' : donor.matchScore >= 60 ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${donor.matchScore}%` }}
                  />
                </div>
              </div>

              {/* Health & Eligibility Flags (staff-only) */}
              {isVerifiedStaff && donor.healthFlags && donor.healthFlags.length > 0 && (
                <div className="mt-2 ml-12 flex flex-wrap gap-1.5">
                  {donor.healthFlags.map((flag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Flag className="w-2.5 h-2.5" /> {flag}
                    </span>
                  ))}
                </div>
              )}
              {isVerifiedStaff && donor.eligibility && !donor.eligibility.eligible && (
                <div className="mt-1 ml-12">
                  <span className="inline-flex items-center gap-1 text-[10px] text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-2.5 h-2.5" /> {donor.eligibility.reason}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        {(!matches || matches.length === 0) && (
          <div className="p-8 text-center text-gray-500">
            No matched donors found. Try creating a new request.
          </div>
        )}
      </div>
    </div>
  );
}
