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
  const clean = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 3) return null;

  const key = clean.length === 6 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean;

  const hit = geocodeCache.get<GeocodedLocation>(key);
  if (hit !== undefined) {
    logger.debug({ postalCode: key }, "geocode cache hit");
    return hit;
  }

  const fetchGeocode = async (query: string): Promise<GeocodedLocation | null> => {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q",            query);
    url.searchParams.set("format",       "json");
    url.searchParams.set("limit",        "1");
    url.searchParams.set("countrycodes", "ca");

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "MohaDrivingBookingAPI/1.0 (contact@mohadriving.ca)",
          "Accept":     "application/json",
        },
      });

      if (!response.ok) return null;
      const data = (await response.json()) as NominatimResult[];
      const first = data[0];
      if (!first) return null;

      return {
        lat:         parseFloat(first.lat),
        lng:         parseFloat(first.lon),
        displayName: first.display_name,
      };
    } catch (err) {
      logger.error({ err, query }, "Nominatim fetch failed");
      return null;
    }
  };

  // Attempt 1: Exact postal code with space (e.g. "M5V 2T6, Canada")
  let result = await fetchGeocode(`${key}, Canada`);

  // Attempt 2 Fallback: FSA prefix (e.g. "M5V, Ontario, Canada")
  if (!result && clean.length >= 3) {
    const fsa = clean.slice(0, 3);
    logger.debug({ fsa, key }, "exact postal code not found, falling back to FSA prefix");
    result = await fetchGeocode(`${fsa}, Ontario, Canada`);
  }

  if (result) {
    geocodeCache.set(key, result);
    logger.debug({ postalCode: key, lat: result.lat, lng: result.lng }, "geocoded successfully");
  }

  return result;
}
