import { useEffect, useMemo, useState } from 'react';
import {
  Building2, MapPin, Phone, Droplets, Loader2, Filter,
  Navigation, ExternalLink, LocateFixed,
} from 'lucide-react';
import { api } from '../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const CITIES = ['', 'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan'];

/** Great-circle distance in km between two WGS-84 coordinates. */
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function telHref(value) {
  return `tel:${String(value || '').replace(/[^\d+]/g, '')}`;
}

export default function Hospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = {};
    if (city) params.city = city;
    if (type) params.type = type;

    api.getHospitals(params)
      .then(setHospitals)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [city, type]);

  const handleNearMe = () => {
    if (userLocation) {
      setUserLocation(null);
      setGeoError('');
      return;
    }
    if (!('geolocation' in navigator)) {
      setGeoError('Your browser does not support location sharing.');
      return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        const message = err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. You can still open any facility in Google Maps.'
          : 'Could not get your location. Please try again.';
        setGeoError(message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

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

  const visibleHospitals = useMemo(() => {
    const list = [...hospitals];
    if (!userLocation) return list;
    const distanceOf = (h) => (
      Number.isFinite(h.lat) && Number.isFinite(h.lng)
        ? distanceKm(userLocation.lat, userLocation.lng, h.lat, h.lng)
        : Number.POSITIVE_INFINITY
    );
    return list.sort((a, b) => distanceOf(a) - distanceOf(b));
  }, [hospitals, userLocation]);

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-red-600" />
            Hospitals & Blood Banks
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Verified addresses and helplines across Pakistan. Open any facility in Google Maps
            or tap Directions for turn-by-turn navigation.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNearMe}
          disabled={locating}
          className={`self-start sm:self-auto flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border transition-colors ${
            userLocation
              ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {locating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Locating...</>
            : <><LocateFixed className="w-4 h-4" /> {userLocation ? 'Nearest first' : 'Near me'}</>}
        </button>
      </div>

      {geoError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          {geoError}
        </div>
      )}

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
          {userLocation && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
              Showing nearest first
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleHospitals.map((hospital) => {
            const address = hospital.address
              || [hospital.area, hospital.city].filter(Boolean).join(', ');
            const helpline = hospital.helpline || hospital.phone;
            const altPhone = hospital.phone && hospital.phone !== helpline ? hospital.phone : null;
            const mapUrl = hospital.mapUrl
              || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hospital.name}, ${address}`)}`;
            const directionsUrl = hospital.directionsUrl
              || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${hospital.name}, ${address}`)}`;
            const totalStock = getTotalStock(hospital);
            const inventoryReported = totalStock > 0 || Boolean(hospital.inventoryUpdatedAt);
            const distance = userLocation
              && Number.isFinite(hospital.lat) && Number.isFinite(hospital.lng)
              ? distanceKm(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng)
              : null;

            return (
              <div key={hospital._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-w-0">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900 break-words">{hospital.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                          hospital.type === 'blood_bank'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {hospital.type === 'blood_bank' ? 'Blood Bank' : 'Hospital'}
                        </span>
                      </div>

                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-1.5 mt-1.5 text-xs text-gray-600 hover:text-red-600 min-w-0"
                        title="Open this facility in Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="break-words underline decoration-gray-300 underline-offset-2">
                          {address}
                        </span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      </a>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2.5 text-xs text-gray-500">
                        <a
                          href={telHref(helpline)}
                          className="flex items-center gap-1 text-red-600 font-medium hover:underline whitespace-nowrap"
                        >
                          <Phone className="w-3.5 h-3.5" /> Helpline: {helpline}
                        </a>
                        {altPhone && (
                          <a
                            href={telHref(altPhone)}
                            className="flex items-center gap-1 text-gray-600 font-medium hover:underline whitespace-nowrap"
                          >
                            <Phone className="w-3.5 h-3.5" /> Main: {altPhone}
                          </a>
                        )}
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Droplets className="w-3.5 h-3.5 text-red-400" />
                          {inventoryReported ? `${totalStock} total units` : 'Inventory not reported'}
                        </span>
                        {distance !== null && (
                          <span className="flex items-center gap-1 whitespace-nowrap text-gray-700 font-medium">
                            <Navigation className="w-3.5 h-3.5 text-blue-500" /> {distance.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg whitespace-nowrap"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Map
                      </a>
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-800 hover:bg-gray-900 px-3 py-2 rounded-lg whitespace-nowrap"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Directions
                      </a>
                    </div>
                  </div>

                  {/* Blood Inventory Grid */}
                  {inventoryReported ? (
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-4">
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
                  ) : (
                    <p className="mt-4 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      This facility has not reported blood inventory yet. Call the helpline for
                      current availability.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && !error && visibleHospitals.length === 0 && (
        <div className="text-center py-12 text-gray-500">No hospitals found matching your filters</div>
      )}
    </div>
  );
}
