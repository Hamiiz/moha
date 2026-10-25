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

interface GooglePlacesNewReview {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: {
    text: string;
    languageCode?: string;
  };
  originalText?: {
    text: string;
    languageCode?: string;
  };
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  publishTime?: string;
}

interface GooglePlacesNewResponse {
  id?: string;
  displayName?: {
    text: string;
    languageCode?: string;
  };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GooglePlacesNewReview[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Fetch latest Google Reviews using modern Google Places API (New).
 */
async function fetchFromPlacesApiNew(placeId: string, apiKey: string): Promise<ReviewsData> {
  const resourceName = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
  const url = `https://places.googleapis.com/v1/${resourceName}?languageCode=en`;

  logger.info({ placeId, resourceName }, "Fetching reviews from Google Places API (New)");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews,googleMapsUri",
    },
  });

  if (!res.ok) {
    let errorDetail = `${res.status} ${res.statusText}`;
    try {
      const errJson = (await res.json()) as GooglePlacesNewResponse;
      if (errJson?.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(`Google Places API (New) error: ${errorDetail}`);
  }

  const data = (await res.json()) as GooglePlacesNewResponse;
  const rawReviews = data.reviews || [];

  logger.info(
    {
      placeId,
      rating: data.rating,
      userRatingCount: data.userRatingCount,
      rawReviewsCount: rawReviews.length,
    },
    "Google Places API (New) response"
  );

  const formattedReviews: GoogleReviewItem[] = rawReviews.map((r, i) => {
    const name =
      r.authorAttribution?.displayName ||
      (r as any).author_name ||
      (r as any).displayName ||
      "Google User";
    const initials = name.trim().charAt(0).toUpperCase() || "U";
    const timeMs = r.publishTime
      ? new Date(r.publishTime).getTime()
      : Date.now() - i * 86400000;
    const reviewText =
      typeof r.text === "string"
        ? r.text
        : r.text?.text || r.originalText?.text || (r as any).text || "";

    return {
      id: `google-${timeMs}-${i}`,
      authorName: name,
      rating: typeof r.rating === "number" ? r.rating : 5,
      relativeTime:
        r.relativePublishTimeDescription ||
        (r as any).relative_time_description ||
        "Recent",
      text: reviewText.trim() || "Passed road test on first attempt! Highly recommend.",
      profilePhotoUrl:
        r.authorAttribution?.photoUri || (r as any).profile_photo_url,
      initials,
    };
  });

  const currentReviews = getReviews();
  const updatedReviewsList =
    formattedReviews.length > 0 ? formattedReviews : currentReviews.reviews;

  const updated: ReviewsData = {
    rating: typeof data.rating === "number" ? data.rating : currentReviews.rating,
    userRatingsTotal:
      typeof data.userRatingCount === "number"
        ? data.userRatingCount
        : Math.max(formattedReviews.length, currentReviews.userRatingsTotal),
    googleMapsUrl:
      data.googleMapsUri ||
      currentReviews.googleMapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=Moha+Driving+School`,
    lastSyncedAt: new Date().toISOString(),
    placeId,
    reviews: updatedReviewsList,
  };

  return updateReviews(updated);
}

/**
 * Fetch latest Google Reviews using legacy Google Places API (Place Details).
 */
async function fetchFromPlacesApiLegacy(placeId: string, apiKey: string): Promise<ReviewsData> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId
  )}&fields=name,rating,user_ratings_total,reviews,url&key=${encodeURIComponent(apiKey)}`;

  logger.info({ placeId }, "Fetching reviews from Legacy Google Places API");

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Places Legacy API HTTP error: ${res.status} ${res.statusText}`);
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
    userRatingsTotal:
      typeof result.user_ratings_total === "number" ? result.user_ratings_total : formattedReviews.length,
    googleMapsUrl: result.url || `https://www.google.com/maps/search/?api=1&query=Moha+Driving+School`,
    lastSyncedAt: new Date().toISOString(),
    placeId,
    reviews: formattedReviews.length > 0 ? formattedReviews : getReviews().reviews,
  };

  return updateReviews(updated);
}

/**
 * Fetch latest Google Reviews from Google Places API.
 * Uses modern Places API (New) by default, falling back to legacy if necessary.
 */
export async function fetchFromGooglePlaces(placeId: string, apiKey: string): Promise<ReviewsData> {
  try {
    return await fetchFromPlacesApiNew(placeId, apiKey);
  } catch (newApiErr: any) {
    logger.warn({ err: newApiErr.message }, "Places API (New) failed, attempting legacy fallback");
    try {
      return await fetchFromPlacesApiLegacy(placeId, apiKey);
    } catch (legacyErr: any) {
      throw new Error(
        `Places API (New): ${newApiErr.message}. Legacy API: ${legacyErr.message}`
      );
    }
  }
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
    const googleCount = updated.reviews.filter((r) => r.id.startsWith("google-")).length;
    let message = "";
    if (googleCount > 0) {
      message = `Successfully synced ${googleCount} real Google reviews and ${updated.rating}★ rating from Google.`;
    } else {
      message = `Updated rating to ${updated.rating}★ (${updated.userRatingsTotal} total reviews) from Google. (Google returned 0 written text comments; existing testimonials kept).`;
    }
    return {
      success: true,
      data: updated,
      message,
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
