// The exact set of areas that appear across every seller's
// Store.deliveryAreas in stores.ts today (Accra, Tema, Kumasi, Tamale) —
// deliberately not a bigger or different list. GRAPPlive doesn't cover
// Ghana nationwide yet; this is "where sellers on this platform can
// actually deliver right now," not an aspirational list of cities.
// Coordinates are approximate city centers (public, well-known
// geographic data), used only for a rough nearest-match against a
// buyer's detected GPS position — not precise delivery-zone boundaries.
export type ServiceArea = {
  name: string;
  latitude: number;
  longitude: number;
};

export const serviceAreas: ServiceArea[] = [
  { name: "Accra", latitude: 5.6037, longitude: -0.187 },
  { name: "Tema", latitude: 5.6698, longitude: -0.0166 },
  { name: "Kumasi", latitude: 6.6885, longitude: -1.6244 },
  { name: "Tamale", latitude: 9.4075, longitude: -0.8533 },
];

// Beyond this distance from the nearest known service area, a detected
// position is treated as outside coverage rather than silently snapped
// to "the nearest city anyway," which would misrepresent what GRAPPlive
// can actually deliver. Generous enough to cover someone in, say, a
// suburb or nearby town of a served city, without pretending coverage
// that doesn't exist for someone genuinely elsewhere in Ghana (or beyond).
export const MAX_COVERAGE_DISTANCE_KM = 80;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Haversine distance in km — standard great-circle distance formula,
// accurate enough for "which city is this closest to," not intended for
// anything requiring real precision.
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

// Returns the nearest known service area to (lat, lon), or null if even
// the closest one is beyond MAX_COVERAGE_DISTANCE_KM — i.e. genuinely
// outside where GRAPPlive can deliver today.
export function nearestServiceArea(lat: number, lon: number): ServiceArea | null {
  let nearest: ServiceArea | null = null;
  let nearestDistance = Infinity;
  for (const area of serviceAreas) {
    const d = distanceKm(lat, lon, area.latitude, area.longitude);
    if (d < nearestDistance) {
      nearestDistance = d;
      nearest = area;
    }
  }
  return nearestDistance <= MAX_COVERAGE_DISTANCE_KM ? nearest : null;
}
