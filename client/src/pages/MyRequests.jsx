import { useState, useEffect } from 'react';
import { FileText, Phone, AlertTriangle, Clock, ChevronDown, ChevronUp, AlertCircle, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());

  useEffect(() => {
    api.getMyRequests()
      .then(setRequests)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-gray-500">Loading your requests...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-6 h-6 text-red-600" />
          My Requests
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Blood requests you have posted. View donor responses and contact information.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">You haven't posted any requests yet.</p>
          <Link to="/request" className="text-red-600 hover:underline text-sm mt-2 inline-block">
            Post a new request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Request header */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-lg font-bold">
                      {req.bloodGroup}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {req.unitsNeeded} unit(s) — {req.hospitalId?.name || 'Unknown Hospital'}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="capitalize flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {req.urgencyLevel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => toggle(req._id)}
                    className="text-gray-400 hover:text-gray-600 p-1">
                    {expanded.has(req._id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Internal reference (staff's own records only) */}
                {req.internalReference && (
                  <div className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600">
                    Internal Ref: <span className="font-mono font-medium">{req.internalReference}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {req.status === 'pending' && (
                    <Link to={`/match/${req._id}`} className="text-red-600 hover:text-red-700 text-xs font-medium bg-red-50 px-3 py-1.5 rounded-lg">
                      Run AI Match
                    </Link>
                  )}
                  {req.status === 'matched' && (
                    <Link to={`/match/${req._id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium bg-blue-50 px-3 py-1.5 rounded-lg">
                      View AI Matches
                    </Link>
                  )}
                </div>
              </div>

              {/* Donor responses (expanded) */}
              {expanded.has(req._id) && (
                <div className="border-t border-gray-100 bg-gray-50 p-5">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Donor Responses ({req.responses?.length || 0})
                  </h4>

                  {(!req.responses || req.responses.length === 0) ? (
                    <p className="text-gray-400 text-sm">No donors have responded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {req.responses.map((resp) => (
                        <div key={resp._id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{resp.donorName}</h5>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                                  {resp.donorBloodGroup}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {resp.donorPhone}
                                </span>
                                <span>{resp.donorCity}</span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Responded: {new Date(resp.respondedAt).toLocaleString()}
                                {resp.daysSinceLastDonation !== null && ` | Last donated ${resp.daysSinceLastDonation} days ago`}
                              </div>
                            </div>
                          </div>

                          {/* Health flags (staff-only) */}
                          {resp.healthFlags && resp.healthFlags.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {resp.healthFlags.map((flag, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                                  <Flag className="w-3 h-3 flex-shrink-0" />
                                  {flag}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Eligibility flags (staff-only) */}
                          {resp.eligibilityFlags && resp.eligibilityFlags.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {resp.eligibilityFlags.map((flag, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1.5 rounded-lg">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                  {flag}
                                </div>
                              ))}
                            </div>
                          )}

                          {(!resp.healthFlags || resp.healthFlags.length === 0) && (!resp.eligibilityFlags || resp.eligibilityFlags.length === 0) && (
                            <div className="mt-2 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-lg inline-block">
                              No flags detected
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
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
