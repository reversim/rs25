// Helper function to create Google Calendar URL
function createGoogleCalendarUrl(
  startDate,
  endDate,
  title,
  description,
  location,
) {
  const startDate = new Date(session.startsAt);
  const endDate = new Date(session.endsAt);

  const formatForCalendar = (date) => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  const startTimeFormatted = formatForCalendar(startDate);
  const endTimeFormatted = formatForCalendar(endDate);

  const speakers = session.speakers.map((s) => s.name).join(", ");
  const title = encodeURIComponent(session.title);
  const details = encodeURIComponent(
    `
Speakers: ${speakers}
Room: ${session.room}

${session.description || "No description available."}
    `.trim(),
  );

  const location = encodeURIComponent(`Room: ${session.room}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTimeFormatted}/${endTimeFormatted}&details=${details}&location=${location}`;
}
