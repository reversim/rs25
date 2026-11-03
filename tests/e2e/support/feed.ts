import fixture from "../fixtures/agenda.json";

// Mock of the Sessionize GridSmart feed. The dev server the tests run against
// answers the agenda request with this file (see devServer.mjs), and the tests read it
// here, without going through the site's own helpers, so a bug in those
// helpers can't hide behind matching expectations.

interface RawSession {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  room: string;
  isServiceSession: boolean;
  speakers: { name: string }[];
  categories: { name: string; categoryItems: { name: string }[] }[];
}

interface RawDay {
  date: string;
  rooms: { name: string; sessions: RawSession[] }[];
}

export interface FeedSession {
  id: string;
  title: string;
  description: string | null;
  // Venue wall time without an offset, e.g. "2026-11-30T09:00:00".
  startsAt: string;
  endsAt: string;
  room: string;
  // Track as the site labels it (Sessionize "Frontend" is shown as
  // "Frontend/Product"), or null for sessions without a Track.
  track: string | null;
  speakers: string[];
  isServiceSession: boolean;
}

export interface FeedDay {
  slug: string;
  sessions: FeedSession[];
  // The day's Ignites talks, which the site groups into one block.
  ignites: FeedSession[];
}

function trackOf(session: RawSession): string | null {
  const name = session.categories.find((c) => c.name === "Track")
    ?.categoryItems[0]?.name;
  if (!name) return null;
  return name === "Frontend" ? "Frontend/Product" : name;
}

function toDay(day: RawDay): FeedDay {
  const byId = new Map<string, FeedSession>();
  for (const s of day.rooms.flatMap((room) => room.sessions)) {
    byId.set(s.id, {
      id: s.id,
      title: s.title,
      description: s.description,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      room: s.room,
      track: trackOf(s),
      speakers: s.speakers.map((sp) => sp.name),
      isServiceSession: s.isServiceSession,
    });
  }
  const sessions = [...byId.values()].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  return {
    slug: day.date.slice(0, 10),
    sessions,
    ignites: sessions.filter((s) => s.track === "Ignites"),
  };
}

export const feed: FeedDay[] = (fixture as RawDay[])
  .map(toDay)
  .sort((a, b) => a.slug.localeCompare(b.slug));

// Converts a venue (Asia/Jerusalem) wall time to an absolute Date, using the
// zone's real offset on that date rather than a hard-coded one.
export function venueTime(wall: string): Date {
  const asUtc = new Date(`${wall}Z`);
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    timeZoneName: "longOffset",
  })
    .formatToParts(asUtc)
    .find((p) => p.type === "timeZoneName")!.value; // e.g. "GMT+02:00"
  const [, sign, hh, mm] = /GMT([+-])(\d{2}):(\d{2})/.exec(offset)!;
  const minutes = (Number(hh) * 60 + Number(mm)) * (sign === "+" ? 1 : -1);
  return new Date(asUtc.getTime() - minutes * 60_000);
}

// The UTC "YYYYMMDDTHHMMSSZ" form calendar services expect.
export function calendarStamp(wall: string): string {
  return venueTime(wall)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}
