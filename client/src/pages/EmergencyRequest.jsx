import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['critical', 'high', 'medium'];

export default function EmergencyRequest() {
  const navigate = useNavigate();
  const { isVerifiedStaff } = useAuth();
  const [step, setStep] = useState(1);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    patientName: '',
    bloodGroup: '',
    unitsNeeded: 1,
    hospitalId: '',
    urgencyLevel: 'high',
    contactNumber: '',
    notes: '',
    internalReference: '',
  });

  useEffect(() => {
    api.getHospitals().then(setHospitals).catch(console.error);
  }, []);

  const updateForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const canNext = () => {
    if (step === 1) return form.patientName.trim().length >= 2 && form.bloodGroup;
    if (step === 2) return form.hospitalId && form.unitsNeeded >= 1 && form.unitsNeeded <= 20;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const phonePattern = /^(\+?92|0)?[\s-]?3\d{2}[\s-]?\d{7}$/;
    if (form.contactNumber && !phonePattern.test(form.contactNumber)) {
      setError('Enter a valid Pakistani mobile number, e.g. 0300-1234567.');
      setLoading(false);
      return;
    }
    if (form.unitsNeeded < 1 || form.unitsNeeded > 20) {
      setError('Units needed must be between 1 and 20.');
      setLoading(false);
      return;
    }

    try {
      const request = await api.createRequest(form);
      // Run AI matching
      const matchResult = await api.runMatching(request._id);
      navigate(`/match/${request._id}`, { state: { matchResult } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Guard: redirect non-staff to dashboard
  if (!isVerifiedStaff) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Only verified hospital staff can post blood requests.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 text-white">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Blood Request
          </h1>
          <p className="text-red-100 text-sm mt-1">
            Fill in the details and our AI will match you with the best donors
          </p>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                <span className={`text-sm hidden sm:inline ${step >= s ? 'text-red-700 font-medium' : 'text-gray-500'}`}>
                  {s === 1 ? 'Patient Info' : s === 2 ? 'Hospital & Units' : 'Confirm'}
                </span>
                {s < 3 && <ChevronRight className="w-4 h-4 text-gray-300 ml-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={(e) => updateForm('patientName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="Enter patient's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group Needed</label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => updateForm('bloodGroup', bg)}
                      className={`py-3 rounded-lg text-sm font-bold transition-all ${
                        form.bloodGroup === bg
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {URGENCY_LEVELS.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => updateForm('urgencyLevel', level)}
                      className={`py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                        form.urgencyLevel === level
                          ? level === 'critical' ? 'bg-red-600 text-white' : level === 'high' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital / Blood Bank</label>
                <select
                  value={form.hospitalId}
                  onChange={(e) => updateForm('hospitalId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                >
                  <option value="">Select hospital...</option>
                  {hospitals.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} ({h.city} - {h.area})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Units Needed</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.unitsNeeded}
                  onChange={(e) => updateForm('unitsNeeded', parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={form.contactNumber}
                  onChange={(e) => updateForm('contactNumber', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  placeholder="03XX-XXXXXXX"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-800">Review Request</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Patient:</span> <span className="font-medium">{form.patientName}</span></div>
                  <div><span className="text-gray-500">Blood Group:</span> <span className="font-bold text-red-600">{form.bloodGroup}</span></div>
                  <div><span className="text-gray-500">Urgency:</span> <span className="font-medium capitalize">{form.urgencyLevel}</span></div>
                  <div><span className="text-gray-500">Units:</span> <span className="font-medium">{form.unitsNeeded}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Hospital:</span> <span className="font-medium">{hospitals.find((h) => h._id === form.hospitalId)?.name}</span></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => updateForm('notes', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    rows={2}
                    placeholder="Any additional information..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internal Reference <span className="text-gray-400 font-normal">(your records only, e.g. admission ID)</span>
                  </label>
                  <input
                    type="text"
                    value={form.internalReference}
                    onChange={(e) => updateForm('internalReference', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    placeholder="e.g. ADM-2026-0042"
                  />
                  <p className="text-xs text-gray-400 mt-1">This will never be shown to other users or donors.</p>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running AI Match...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Submit & Find Donors
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
