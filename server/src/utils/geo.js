/**
 * City-center coordinates for Pakistan's major cities (same centers the
 * seeder uses). Donors registered without precise coordinates are placed
 * at their city center so the AI matching engine can still distance-score
 * them — a missing location must never silently exclude a donor.
 */
const CITY_CENTERS = {
  Lahore: [31.5204, 74.3587],
  Karachi: [24.8607, 67.0011],
  Islamabad: [33.6844, 73.0479],
  Rawalpindi: [33.5651, 73.0169],
  Faisalabad: [31.4504, 73.1350],
  Multan: [30.1575, 71.5249],
};

/**
 * Approximate coordinates for a city with a small random jitter (~±2 km)
 * so multiple donors from the same city don't stack on one exact point.
 * Returns null for unknown cities.
 */
function cityCoords(city) {
  const center = CITY_CENTERS[city];
  if (!center) return null;
  return {
    lat: center[0] + (Math.random() - 0.5) * 0.04,
    lng: center[1] + (Math.random() - 0.5) * 0.04,
  };
}

module.exports = { CITY_CENTERS, cityCoords };
