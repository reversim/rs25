import { getAgendaDays } from "../helpers/getAgenda";

export async function getAgendaCurrentDay() {
  // Get agenda data from Sessionize
  const rawAgendaDays = await getAgendaDays();

  if (rawAgendaDays.length > 0) {
    // Get current date in yyyy-mm-dd format
    const currentDate = new Date().toISOString().split("T")[0];

    // Check if current date matches any conference day
    const currentConferenceDay = rawAgendaDays.find(
      (day) => day.slug === currentDate,
    );

    if (currentConferenceDay) {
      // Current day is a conference day, redirect to it
      return `/agenda/${currentDate}`;
    } else {
      // Current day is not a conference day, redirect to the first day
      const firstDaySlug =
        rawAgendaDays[0].slug ||
        new Date(rawAgendaDays[0].date).toISOString().split("T")[0];
      return `/agenda/${firstDaySlug}`;
    }
  } else {
    // No agenda data available
    throw new Error("No agenda data available");
  }
}
