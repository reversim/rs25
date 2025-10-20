import type { AgendaSession } from "./getAgenda";

/**
 * Format date for calendar URLs (YYYYMMDDTHHMMSSZ format)
 */
function formatDateForCalendar(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Generate event details text
 */
function generateEventDetails(session: AgendaSession): string {
  const speakers = session.speakers.map((s) => s.name).join(", ");
  return `
Speakers: ${speakers}
Room: ${session.room}

${session.description || "No description available."}
  `.trim();
}

/**
 * Generate Google Calendar URL
 */
export function createGoogleCalendarUrl(session: AgendaSession): string {
  const startDate = new Date(session.startsAt);
  const endDate = new Date(session.endsAt);

  const startTimeFormatted = formatDateForCalendar(startDate);
  const endTimeFormatted = formatDateForCalendar(endDate);

  const title = encodeURIComponent(session.title);
  const details = encodeURIComponent(generateEventDetails(session));
  const location = encodeURIComponent(`${session.room}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTimeFormatted}/${endTimeFormatted}&details=${details}&location=${location}`;
}

/**
 * Generate Outlook Calendar URL
 */
export function createOutlookCalendarUrl(session: AgendaSession): string {
  const startDate = new Date(session.startsAt);
  const endDate = new Date(session.endsAt);

  const startTimeFormatted = formatDateForCalendar(startDate);
  const endTimeFormatted = formatDateForCalendar(endDate);

  const title = encodeURIComponent(session.title);
  const details = encodeURIComponent(generateEventDetails(session));
  const location = encodeURIComponent(`${session.room}`);

  return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startTimeFormatted}&enddt=${endTimeFormatted}&body=${details}&location=${location}`;
}

/**
 * Generate Yahoo Calendar URL
 */
export function createYahooCalendarUrl(session: AgendaSession): string {
  const startDate = new Date(session.startsAt);
  const endDate = new Date(session.endsAt);

  const startTimeFormatted = formatDateForCalendar(startDate);
  const endTimeFormatted = formatDateForCalendar(endDate);

  const title = encodeURIComponent(session.title);
  const details = encodeURIComponent(generateEventDetails(session));
  const location = encodeURIComponent(`${session.room}`);

  return `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${startTimeFormatted}&et=${endTimeFormatted}&desc=${details}&in_loc=${location}`;
}

/**
 * Generate iCal file content (.ics)
 */
export function createICalContent(session: AgendaSession): string {
  const startDate = new Date(session.startsAt);
  const endDate = new Date(session.endsAt);

  const startTimeFormatted = formatDateForCalendar(startDate);
  const endTimeFormatted = formatDateForCalendar(endDate);
  const now = formatDateForCalendar(new Date());

  const details = generateEventDetails(session)
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,");

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Reversim Summit//Event//EN
BEGIN:VEVENT
UID:${session.id}@reversim.com
DTSTAMP:${now}
DTSTART:${startTimeFormatted}
DTEND:${endTimeFormatted}
SUMMARY:${session.title}
DESCRIPTION:${details}
LOCATION:${session.room}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

/**
 * Generate iCal download URL
 */
export function createICalUrl(session: AgendaSession): string {
  const icalContent = createICalContent(session);
  const blob = new Blob([icalContent], { type: "text/calendar" });
  return URL.createObjectURL(blob);
}

export type CalendarType = "google" | "outlook" | "yahoo" | "ical";

/**
 * Get calendar URL based on calendar type
 */
export function getCalendarUrl(session: AgendaSession, type: CalendarType): string {
  switch (type) {
    case "google":
      return createGoogleCalendarUrl(session);
    case "outlook":
      return createOutlookCalendarUrl(session);
    case "yahoo":
      return createYahooCalendarUrl(session);
    case "ical":
      // iCal is handled differently (download)
      return "#";
    default:
      return createGoogleCalendarUrl(session);
  }
}

