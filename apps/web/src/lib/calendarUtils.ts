export interface CalendarEventDetails {
  bookingId: string;
  studentName: string;
  startIso: string;
  endIso: string;
  pickupAddress: string;
  phone?: string;
  total?: number;
}

function formatUtcForCalendar(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Generates a pre-filled Google Calendar event URL for 1-click web saving.
 */
export function generateGoogleCalendarUrl(event: CalendarEventDetails): string {
  const start = formatUtcForCalendar(event.startIso);
  const end = formatUtcForCalendar(event.endIso);
  const title = `Driving Lesson with Moha Driving School`;
  const details = [
    `Driving Lesson with Moha Driving School`,
    `Confirmation ID: ${event.bookingId}`,
    `Student: ${event.studentName}`,
    `Pickup Location: ${event.pickupAddress}`,
    event.total ? `Total: $${event.total}` : "",
    `Instructor Contact: ${event.phone || "(647) 912-7040"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details,
    location: event.pickupAddress,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates RFC 5545 iCalendar content with an automatic 2-hour pre-lesson alert.
 */
export function generateIcsContent(event: CalendarEventDetails): string {
  const start = formatUtcForCalendar(event.startIso);
  const end = formatUtcForCalendar(event.endIso);
  const now = formatUtcForCalendar(new Date().toISOString());

  const summary = `Driving Lesson with Moha Driving School`;
  const description = `Confirmation ID: ${event.bookingId}\\nStudent: ${event.studentName}\\nPickup: ${event.pickupAddress}\\nInstructor: ${event.phone || "(647) 912-7040"}`;
  const location = event.pickupAddress.replace(/,/g, "\\,");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Moha Driving School//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.bookingId}@mohadriving.ca`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder: Driving Lesson with Moha in 2 hours",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Triggers native browser download of the .ics file for Apple Calendar, Outlook, and local calendar apps.
 */
export function downloadIcsFile(event: CalendarEventDetails): void {
  const ics = generateIcsContent(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `moha-driving-lesson-${event.bookingId}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
