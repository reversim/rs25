export interface AgendaSpeaker {
  id: string | number;
  name: string;
}

export interface AgendaSession {
  id: string | number;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  roomId?: number;
  room?: string;
  speakers: AgendaSpeaker[];
  isServiceSession?: boolean;
  isPlenumSession?: boolean;
  categories?: any[];
  // computed
  lengthMinutes?: number;
}

export interface AgendaRoom {
  id: number;
  name: string;
  sort?: number; // not in API but keep for potential manual ordering
  sessions: AgendaSession[];
}

// Raw day as returned by GridSmart endpoint (simplified)
export interface RawGridDay {
  date: string; // ISO with time e.g. 2025-10-27T00:00:00Z
  isDefault?: boolean;
  rooms: AgendaRoom[];
  hasOnlyPlenumSessions?: boolean;
}

export interface AgendaDay extends RawGridDay {
  slug: string; // date-only slug (yyyy-mm-dd)
  label: string; // human readable date (e.g. Mon Oct 27)
}

const AGENDA_URL = "https://sessionize.com/api/v2/fan6lxrk/view/GridSmart";

function formatDayLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dateSlug(dateStr: string) {
  // Keep date part only (yyyy-mm-dd)
  return new Date(dateStr).toISOString().split("T")[0];
}

export async function getAgendaDays(): Promise<AgendaDay[]> {
  const res = await fetch(AGENDA_URL);
  if (!res.ok) throw new Error("Failed fetching agenda");
  const raw: RawGridDay[] = await res.json();

  // normalize & sort rooms alphabetically (or by provided sort if exists)
  const days: AgendaDay[] = raw.map((day) => ({
    ...day,
    rooms: [...day.rooms].sort(
      (a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name)
    ),
    slug: dateSlug(day.date),
    label: formatDayLabel(day.date),
  }));

  // Sort days chronologically
  days.sort((a, b) => a.slug.localeCompare(b.slug));
  return days;
}

// Build grid rows based on distinct session start times across all rooms
export function buildDayGrid(day: AgendaDay) {
  const rooms = day.rooms;
  const startsSet = new Set<string>();
  rooms.forEach((r) => r.sessions.forEach((s) => startsSet.add(s.startsAt)));
  const starts = Array.from(startsSet).sort();

  return starts.map((startAt) => {
    const rowSessions = rooms.map((room) => room.sessions.find((s) => s.startsAt === startAt));
    // Determine row end as the maximum end among sessions starting now
    const ends = rowSessions.filter(Boolean).map((s) => new Date(s!.endsAt).getTime());
    const rowEnd = ends.length ? new Date(Math.max(...ends)).toISOString() : startAt;

    // Build cells with potential merging of identical session IDs across adjacent rooms
    interface Cell { key: string; session?: AgendaSession; span?: number; hidden?: boolean; }
    const cells: Cell[] = rowSessions.map((s, idx) => ({ key: `${startAt}-${rooms[idx].id}`, session: s }));

    for (let i = 0; i < cells.length; i++) {
      const s = cells[i].session;
      if (!s) continue;
      let span = 1;
      for (let j = i + 1; j < cells.length; j++) {
        if (cells[j].session && cells[j].session!.id === s.id) {
          span++;
          cells[j].hidden = true;
        } else break;
      }
      cells[i].span = span;
    }

    return {
      startsAt: startAt,
      endsAt: rowEnd,
      cells,
    };
  });
}
