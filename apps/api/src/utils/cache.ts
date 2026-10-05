import NodeCache from "node-cache";

/** Geocoding cache — 24-hour TTL. Postal codes rarely move. */
export const geocodeCache = new NodeCache({ stdTTL: 86_400, checkperiod: 3_600 });

/** Calendar events cache — 60-second TTL per date string. */
export const calendarCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
