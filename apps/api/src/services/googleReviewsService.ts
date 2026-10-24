import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import {
  getReviews,
  updateReviews,
  getSettings,
  type GoogleReviewItem,
  type ReviewsData,
} from "./storeService.js";

interface GooglePlaceReviewRaw {
  author_name: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
  profile_photo_url?: string;
}

interface GooglePlaceDetailsResponse {
  status: string;
  error_message?: string;
  result?: {
    name?: string;
    rating?: number;
    user_ratings_total?: number;
    url?: string;
    reviews?: GooglePlaceReviewRaw[];
  };
}

/**
 * Fetch latest Google Reviews from Google Places API (Place Details).
 */
export async function fetchFromGooglePlaces(placeId: string, apiKey: string): Promise<ReviewsData> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId
  )}&fields=name,rating,user_ratings_total,reviews,url&key=${encodeURIComponent(apiKey)}`;

  logger.info({ placeId }, "Fetching reviews from Google Places API");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Places API HTTP error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as GooglePlaceDetailsResponse;

  if (data.status !== "OK" || !data.result) {
    throw new Error(
      `Google Places API returned status "${data.status}": ${data.error_message || "Unknown error"}`
    );
  }

  const result = data.result;
  const rawReviews = result.reviews || [];

  const formattedReviews: GoogleReviewItem[] = rawReviews.map((r, i) => {
    const name = r.author_name || "Google User";
    const initials = name.trim().charAt(0).toUpperCase() || "U";
    return {
      id: `google-${r.time || Date.now()}-${i}`,
      authorName: name,
      rating: r.rating || 5,
      relativeTime: r.relative_time_description || "Recent",
      text: r.text || "",
      profilePhotoUrl: r.profile_photo_url,
      initials,
    };
  });

  const updated: ReviewsData = {
    rating: typeof result.rating === "number" ? result.rating : 4.9,
    userRatingsTotal: typeof result.user_ratings_total === "number" ? result.user_ratings_total : formattedReviews.length,
    googleMapsUrl: result.url || `https://www.google.com/maps/search/?api=1&query=Moha+Driving+School`,
    lastSyncedAt: new Date().toISOString(),
    placeId,
    reviews: formattedReviews.length > 0 ? formattedReviews : getReviews().reviews,
  };

  return updateReviews(updated);
}

/**
 * Sync Google Reviews into persistent store.
 * - By default, respects a 14-day cache (refreshes weekly or every 2-3 weeks).
 * - Passing force = true overrides the cache check and syncs immediately.
 */
export async function syncGoogleReviews(force = false): Promise<{
  success: boolean;
  data: ReviewsData;
  message: string;
}> {
  const settings = getSettings();
  const placeId = settings.googlePlaceId || env.GOOGLE_PLACE_ID;
  const apiKey = env.GOOGLE_PLACES_API_KEY;

  const current = getReviews();

  if (!apiKey || !placeId) {
    return {
      success: false,
      data: current,
      message: !placeId
        ? "Google Place ID is not configured. Set it in Site Settings."
        : "GOOGLE_PLACES_API_KEY is not configured in environment variables.",
    };
  }

  // Check if cache is still fresh (default: 14 days)
  if (!force && current.lastSyncedAt) {
    const lastSync = new Date(current.lastSyncedAt).getTime();
    const ageDays = (Date.now() - lastSync) / (1000 * 60 * 60 * 24);
    if (ageDays < 14) {
      return {
        success: true,
        data: current,
        message: `Reviews are up-to-date (synced ${Math.round(ageDays)} days ago). Weekly sync schedule active.`,
      };
    }
  }

  try {
    const updated = await fetchFromGooglePlaces(placeId, apiKey);
    return {
      success: true,
      data: updated,
      message: `Successfully pulled ${updated.reviews.length} reviews and ${updated.rating}★ rating from Google.`,
    };
  } catch (err: any) {
    logger.error({ err }, "Error syncing Google reviews");
    return {
      success: false,
      data: current,
      message: `Failed to pull from Google: ${err.message || "Unknown error"}. Cached reviews preserved.`,
    };
  }
}
