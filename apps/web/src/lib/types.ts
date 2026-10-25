export interface LocationValidateResponse {
  postalCode: string;
  centralHub?: {
    address: string;
    lat: number;
    lng: number;
  };
  location?: {
    lat: number;
    lng: number;
    displayName: string;
  };
  isWithinServiceArea: boolean;
  distanceKm: number;
  surcharge?: number;
  availablePickupHubs?: Array<{
    name: string;
    address: string;
    lat: number;
    lng: number;
  }>;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface AvailabilityResponse {
  date: string;
  dayOfWeek: string;
  totalAvailableSlots: number;
  slots: TimeSlot[];
}

export interface LessonTypeOption {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  badge?: string;
}

export interface BookingConfirmationResponse {
  bookingId: string;
  studentName: string;
  email: string;
  slot: TimeSlot;
  pickupAddress: string;
  mapsUrl: string;
  pricing: {
    base: number;
    surcharge: number;
    total: number;
    currency: string;
  };
  confirmedAt: string;
}

export interface HourlyRates {
  g2: number;
  g: number;
  beginner: number;
  refresher: number;
}

export interface PublicSettings {
  phone: string;
  email: string;
  instructorName: string;
  bannerNotice?: string;
  hourlyRates: HourlyRates;
  bufferMinutes: number;
  lessonDurationMinutes: number;
  baseAddress: string;
  googlePlaceId?: string;
}

export interface VehicleItem {
  id: string;
  name: string;
  subtitle: string;
  badgeText?: string;
  badgeIcon?: string;
  features: string[];
}

export interface GoogleReviewItem {
  id: string;
  authorName: string;
  rating: number;
  relativeTime: string;
  text: string;
  profilePhotoUrl?: string;
  initials: string;
}

export interface ReviewsData {
  rating: number;
  userRatingsTotal: number;
  googleMapsUrl?: string;
  lastSyncedAt?: string;
  placeId?: string;
  reviews: GoogleReviewItem[];
}
