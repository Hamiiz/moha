import { geocodeCache } from "../utils/cache.js";
import { logger } from "../utils/logger.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/** Regex matching valid Canadian FSA+LDU postal codes with optional separator. */
export const CANADIAN_POSTAL_CODE_RE = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

export interface GeocodedLocation {
  lat:         number;
  lng:         number;
  displayName: string;
}

interface NominatimResult {
  lat:          string;
  lon:          string;
  display_name: string;
}

/**
 * Resolves a Canadian postal code to geographic coordinates.
 * Results are cached for 24 hours to avoid hitting Nominatim rate limits.
 * Returns null if the code cannot be geocoded.
 */
export async function geocodePostalCode(
  postalCode: string,
): Promise<GeocodedLocation | null> {
  const key = postalCode.toUpperCase().replace(/\s/g, "");

  const hit = geocodeCache.get<GeocodedLocation>(key);
  if (hit !== undefined) {
    logger.debug({ postalCode: key }, "geocode cache hit");
    return hit;
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q",            `${key}, Canada`);
  url.searchParams.set("format",       "json");
  url.searchParams.set("limit",        "1");
  url.searchParams.set("countrycodes", "ca");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "DrivingInstructorBookingAPI/1.0 (contact@example.com)",
        "Accept":     "application/json",
      },
    });
  } catch (err) {
    logger.error({ err, postalCode: key }, "Nominatim fetch failed");
    return null;
  }

  if (!response.ok) {
    logger.error({ status: response.status, postalCode: key }, "Nominatim returned non-OK status");
    return null;
  }

  const data = (await response.json()) as NominatimResult[];

  const first = data[0];
  if (first === undefined) return null;

  const result: GeocodedLocation = {
    lat:         parseFloat(first.lat),
    lng:         parseFloat(first.lon),
    displayName: first.display_name,
  };

  geocodeCache.set(key, result);
  logger.debug({ postalCode: key, lat: result.lat, lng: result.lng }, "geocoded");
  return result;
}
