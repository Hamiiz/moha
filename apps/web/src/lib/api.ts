import type { LocationValidateResponse, AvailabilityResponse, BookingConfirmationResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export async function validateLocation(postalCode: string): Promise<LocationValidateResponse> {
  const res = await fetch(`${API_BASE}/location/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postalCode }),
  });

  const json = (await res.json()) as any;
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Failed to validate location");
  }

  return json.data;
}

export async function getAvailability(date: string): Promise<AvailabilityResponse> {
  const res = await fetch(`${API_BASE}/availability?date=${date}`);
  const json = (await res.json()) as any;

  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Failed to fetch availability");
  }

  return json.data;
}

export async function createBooking(payload: any): Promise<BookingConfirmationResponse> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = (await res.json()) as any;
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Failed to complete booking");
  }

  return json.data;
}
