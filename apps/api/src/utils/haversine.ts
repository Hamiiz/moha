const EARTH_RADIUS_KM = 6_371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Returns the great-circle distance in kilometres between two lat/lng points. */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface PickupHub {
  name:    string;
  address: string;
  lat:     number;
  lng:     number;
}

const PICKUP_HUBS: PickupHub[] = [
  { name: "Scarborough Town Centre",    address: "300 Borough Dr, Scarborough, ON",    lat: 43.7764, lng: -79.2318 },
  { name: "Mississauga City Centre",    address: "100 City Centre Dr, Mississauga, ON",lat: 43.5890, lng: -79.6441 },
  { name: "Vaughan Metropolitan Centre",address: "3080 Rutherford Rd, Vaughan, ON",    lat: 43.7935, lng: -79.5277 },
];

export type SurchargeResult =
  | { isWithinServiceArea: true;  distanceKm: number; surcharge: 0 | 10 }
  | { isWithinServiceArea: false; distanceKm: number; availablePickupHubs: PickupHub[] };

/**
 * Calculates the travel surcharge for a student's location vs the instructor base.
 *  < 10 km  → $0
 * 10–20 km  → $10 CAD
 *  > 20 km  → out of service area, return pickup hubs
 */
export function calculateSurcharge(
  studentLat: number, studentLng: number,
  baseLat: number,    baseLng: number,
): SurchargeResult {
  const dist = haversineDistance(baseLat, baseLng, studentLat, studentLng);
  if (dist < 10)  return { isWithinServiceArea: true,  distanceKm: dist, surcharge: 0 };
  if (dist <= 20) return { isWithinServiceArea: true,  distanceKm: dist, surcharge: 10 };
  return           { isWithinServiceArea: false, distanceKm: dist, availablePickupHubs: PICKUP_HUBS };
}
