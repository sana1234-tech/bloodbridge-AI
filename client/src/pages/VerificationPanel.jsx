import { useState, useEffect } from 'react';
import { ShieldCheck, Building2, MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
// NOTE: In production, this would be a dedicated admin review panel, not open
// peer approval. This simulates admin review for demo purposes.

export default function VerificationPanel() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPending = () => {
    setLoading(true);
    api.getPendingVerifications()
      .then(setPending)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await api.approveStaff(userId);
      fetchPending();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId);
    try {
      await api.rejectStaff(userId);
      fetchPending();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          Staff Verification Panel
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Review and approve pending hospital/blood bank staff registrations
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No pending verifications</p>
          <p className="text-gray-400 text-sm mt-1">All staff accounts have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((staff) => (
            <div key={staff._id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{staff.fullName}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" /> {staff.institutionName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {staff.city}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    License/Reg No: <span className="font-mono font-medium text-gray-600">{staff.institutionLicenseNo}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Phone: {staff.phone} | Applied: {new Date(staff.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                  Pending
                </span>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleApprove(staff._id)}
                  disabled={actionLoading === staff._id}
                  className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === staff._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  onClick={() => handleReject(staff._id)}
                  disabled={actionLoading === staff._id}
                  className="flex items-center gap-1.5 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50"
                >
                  {actionLoading === staff._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
