import { getPickupHubs, type PickupHubItem } from "../services/storeService.js";

const EARTH_RADIUS_KM = 6_371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

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

export type SurchargeResult =
  | { isWithinServiceArea: true;  distanceKm: number; surcharge: 0 | 10 }
  | { isWithinServiceArea: false; distanceKm: number; availablePickupHubs: PickupHubItem[] };

export function calculateSurcharge(
  studentLat: number, studentLng: number,
  baseLat: number,    baseLng: number,
): SurchargeResult {
  const dist = haversineDistance(baseLat, baseLng, studentLat, studentLng);
  if (dist < 10)  return { isWithinServiceArea: true,  distanceKm: dist, surcharge: 0 };
  if (dist <= 20) return { isWithinServiceArea: true,  distanceKm: dist, surcharge: 10 };
  return           { isWithinServiceArea: false, distanceKm: dist, availablePickupHubs: getPickupHubs() };
}
