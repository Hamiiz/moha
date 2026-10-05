export interface LocationValidateResponse {
  postalCode: string;
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
