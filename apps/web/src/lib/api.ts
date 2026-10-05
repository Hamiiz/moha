import type { LocationValidateResponse, AvailabilityResponse, BookingConfirmationResponse, LessonTypeOption } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export async function getPublicPackages(): Promise<LessonTypeOption[]> {
  const res = await fetch(`${API_BASE}/packages`);
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Failed to fetch lesson packages");
  }
  return json.data;
}

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

// ── Instructor APIs ─────────────────────────────────────────────────────────

export async function instructorLogin(pin: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/instructor/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });

  const json = (await res.json()) as any;
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Invalid instructor passcode");
  }

  return json.data;
}

export async function getInstructorSettings(token: string) {
  const res = await fetch(`${API_BASE}/instructor/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to fetch settings");
  return json.data;
}

export async function updateInstructorWeeklySchedule(token: string, schedule: any[]) {
  const res = await fetch(`${API_BASE}/instructor/schedule`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(schedule),
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to update weekly schedule");
  return json.data;
}

export async function getInstructorHubs(token: string) {
  const res = await fetch(`${API_BASE}/instructor/hubs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to fetch hubs");
  return json.data;
}

export async function createInstructorHub(token: string, hub: { name: string; address: string }) {
  const res = await fetch(`${API_BASE}/instructor/hubs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(hub),
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to create hub");
  return json.data;
}

export async function deleteInstructorHub(token: string, id: string) {
  const res = await fetch(`${API_BASE}/instructor/hubs/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to delete hub");
  return json.data;
}

export async function createInstructorPackage(token: string, pkg: { title: string; description: string; basePrice: number; badge?: string }) {
  const res = await fetch(`${API_BASE}/instructor/packages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(pkg),
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to create package");
  return json.data;
}

export async function deleteInstructorPackage(token: string, id: string) {
  const res = await fetch(`${API_BASE}/instructor/packages/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to delete package");
  return json.data;
}

export async function getInstructorBookings(token: string, date: string) {
  const res = await fetch(`${API_BASE}/instructor/bookings?date=${date}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to fetch bookings");
  return json.data;
}

export async function deleteInstructorBooking(token: string, id: string) {
  const res = await fetch(`${API_BASE}/instructor/bookings/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as any;
  if (!res.ok || !json.success) throw new Error(json.error?.message || "Failed to cancel booking");
  return json.data;
}
