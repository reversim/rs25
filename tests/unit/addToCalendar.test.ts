import { describe, expect, it } from "vitest";
import {
  createGoogleCalendarUrl,
  createICalContent,
  createOutlookCalendarUrl,
  createYahooCalendarUrl,
} from "../../src/helpers/agenda/addToCalendar";
import type { CalendarSessionData } from "../../src/types/calendar";

// Venue wall times, as the Sessionize feed writes them. Israel is UTC+2 on this
// date, and the browser runs in the venue's timezone (see vitest.config.ts).
const session: CalendarSessionData = {
  id: "s1",
  title: "Maps & Graphs, Not Vibes",
  startsAt: "2026-11-30T10:20:00",
  endsAt: "2026-11-30T10:50:00",
  room: "A2+A3",
  speakers: [{ name: "Dana Graph" }, { name: "Omer Node" }],
  description: "Line one, with a comma\nLine two",
} as CalendarSessionData;

const START = "20261130T082000Z";
const END = "20261130T085000Z";
const DETAILS = [
  "Speakers: Dana Graph, Omer Node",
  "Room: A2+A3",
  "",
  "Line one, with a comma\nLine two",
].join("\n");

const params = (url: string) => new URL(url).searchParams;

describe("calendar links", () => {
  it("Google gets the title, UTC times, room and details", () => {
    const p = params(createGoogleCalendarUrl(session));
    expect(p.get("action")).toBe("TEMPLATE");
    expect(p.get("text")).toBe(session.title);
    expect(p.get("dates")).toBe(`${START}/${END}`);
    expect(p.get("location")).toBe(session.room);
    expect(p.get("details")).toBe(DETAILS);
  });

  it("Outlook gets the title, UTC times, room and details", () => {
    const p = params(createOutlookCalendarUrl(session));
    expect(p.get("subject")).toBe(session.title);
    expect(p.get("startdt")).toBe(START);
    expect(p.get("enddt")).toBe(END);
    expect(p.get("location")).toBe(session.room);
    expect(p.get("body")).toBe(DETAILS);
  });

  it("Yahoo gets the title, UTC times, room and details", () => {
    const p = params(createYahooCalendarUrl(session));
    expect(p.get("title")).toBe(session.title);
    expect(p.get("st")).toBe(START);
    expect(p.get("et")).toBe(END);
    expect(p.get("in_loc")).toBe(session.room);
    expect(p.get("desc")).toBe(DETAILS);
  });

  it("falls back to a placeholder when a session has no description", () => {
    const p = params(
      createGoogleCalendarUrl({ ...session, description: null }),
    );
    expect(p.get("details")).toContain("No description available.");
  });
});

describe("iCal file", () => {
  it("is one event with the session's fields and escaped details", () => {
    const lines = createICalContent(session).split("\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines.at(-1)).toBe("END:VCALENDAR");
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("END:VEVENT");
    expect(lines).toContain("UID:s1@reversim.com");
    expect(lines).toContain(`SUMMARY:${session.title}`);
    expect(lines).toContain(`DTSTART:${START}`);
    expect(lines).toContain(`DTEND:${END}`);
    expect(lines).toContain(`LOCATION:${session.room}`);
    expect(lines).toContain(
      "DESCRIPTION:Speakers: Dana Graph\\, Omer Node\\nRoom: A2+A3\\n\\nLine one\\, with a comma\\nLine two",
    );
  });
});
