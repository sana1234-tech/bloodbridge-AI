import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Droplets, Loader2, Filter } from 'lucide-react';
import { api } from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CITIES = ['', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (city) params.city = city;
    if (type) params.type = type;

    api.getHospitals(params)
      .then(setHospitals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [city, type]);

  const getTotalStock = (hospital) => {
    if (!hospital.bloodInventory) return 0;
    if (hospital.bloodInventory instanceof Map) {
      return [...hospital.bloodInventory.values()].reduce((s, v) => s + v, 0);
    }
    return Object.values(hospital.bloodInventory).reduce((s, v) => s + (v || 0), 0);
  };

  const getStock = (hospital, bg) => {
    if (!hospital.bloodInventory) return 0;
    if (hospital.bloodInventory instanceof Map) {
      return hospital.bloodInventory.get(bg) || 0;
    }
    return hospital.bloodInventory?.[bg] || 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-red-600" />
          Hospitals & Blood Banks
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Blood inventory across Pakistan's hospitals and blood banks
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="">All Cities</option>
            {CITIES.filter(Boolean).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="">All Types</option>
            <option value="hospital">Hospitals</option>
            <option value="blood_bank">Blood Banks</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {hospitals.map((hospital) => (
            <div key={hospital._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        hospital.type === 'blood_bank'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {hospital.type === 'blood_bank' ? 'Blood Bank' : 'Hospital'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {hospital.area}, {hospital.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {hospital.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3" /> {getTotalStock(hospital)} total units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Blood Inventory Grid */}
                <div className="grid grid-cols-8 gap-2 mt-4">
                  {BLOOD_GROUPS.map((bg) => {
                    const stock = getStock(hospital, bg);
                    const level = stock > 40 ? 'text-green-600 bg-green-50' : stock > 15 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
                    return (
                      <div key={bg} className="text-center">
                        <p className="text-xs text-gray-500 font-medium mb-1">{bg}</p>
                        <div className={`rounded-lg py-1.5 text-sm font-bold ${level}`}>
                          {stock}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && hospitals.length === 0 && (
        <div className="text-center py-12 text-gray-500">No hospitals found matching your filters</div>
      )}
    </div>
  );
}
