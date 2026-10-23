import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, MapPin, Clock, Droplets, AlertTriangle, Loader2,
  CheckCircle2, LogIn, RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const URGENCY_STYLES = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const STATUS_STYLES = {
  pending: 'bg-blue-50 text-blue-700',
  matched: 'bg-purple-50 text-purple-700',
  fulfilled: 'bg-green-50 text-green-700',
};

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function BloodRequests() {
  const { isDonor, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('open');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responded, setResponded] = useState(new Set());
  const [notice, setNotice] = useState(null);

  const loadRequests = () => {
    setLoading(true);
    setError(null);
    api.getRequests({ limit: 50 })
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRequests(); }, []);

  const visible = useMemo(() => {
    if (tab === 'open') {
      return requests.filter((r) => r.status === 'pending' || r.status === 'matched');
    }
    if (tab === 'fulfilled') {
      return requests.filter((r) => r.status === 'fulfilled');
    }
    return requests;
  }, [requests, tab]);

  const handleRespond = async (requestId) => {
    setRespondingTo(requestId);
    setNotice(null);
    try {
      await api.respondToRequest(requestId);
      setResponded((prev) => new Set(prev).add(requestId));
      setNotice({ type: 'success', text: 'Your response has been recorded. The hospital will contact you.' });
    } catch (err) {
      if (/already responded/i.test(err.message)) {
        setResponded((prev) => new Set(prev).add(requestId));
      }
      setNotice({ type: 'error', text: err.message });
    } finally {
      setRespondingTo(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-600" /> Blood Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Live requests from hospitals and blood banks. Donors can respond directly.
          </p>
        </div>
        <button
          onClick={loadRequests}
          className="self-start sm:self-auto flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 bg-white border border-gray-200 px-3 py-2 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {notice && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${
          notice.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notice.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'open', label: 'Open requests' },
          { key: 'fulfilled', label: 'Fulfilled' },
          { key: 'all', label: 'All' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === key ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading requests...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-10 text-center text-gray-500">
          No {tab === 'all' ? '' : tab} requests right now.
        </div>
      )}

      <div className="space-y-3">
        {visible.map((request) => {
          const hospital = request.hospitalId;
          const hasResponded = responded.has(request._id);
          return (
            <article
              key={request._id}
              className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-sm min-w-0"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                    {request.bloodGroup}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{hospital?.name || 'Unknown hospital'}</h2>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${URGENCY_STYLES[request.urgencyLevel] || 'bg-gray-100 text-gray-600'}`}>
                        {request.urgencyLevel}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[request.status] || 'bg-gray-100 text-gray-600'}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {hospital ? `${hospital.area || ''}${hospital.area ? ', ' : ''}${hospital.city || ''}` : 'Location unavailable'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-gray-500">
                  <p className="flex items-center gap-1 sm:justify-end">
                    <Droplets className="w-3.5 h-3.5 text-red-500" />
                    {request.unitsNeeded} unit{request.unitsNeeded === 1 ? '' : 's'} needed
                  </p>
                  <p className="flex items-center gap-1 sm:justify-end mt-1">
                    <Clock className="w-3.5 h-3.5" /> {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>

              {request.status !== 'fulfilled' && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                    Patient details are private. The hospital will contact you after you respond.
                  </p>

                  {isDonor ? (
                    hasResponded ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" /> Response sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRespond(request._id)}
                        disabled={respondingTo === request._id}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2 rounded-lg"
                      >
                        {respondingTo === request._id
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                          : <><Heart className="w-4 h-4" /> I can donate</>}
                      </button>
                    )
                  ) : !user ? (
                    <Link
                      to="/login"
                      className="flex items-center gap-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg"
                    >
                      <LogIn className="w-4 h-4" /> Login as donor to respond
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400">Only donor accounts can respond</span>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
