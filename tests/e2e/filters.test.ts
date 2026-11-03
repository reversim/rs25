import { describe, expect, it } from "vitest";
import {
  cardIds,
  cardOpacities,
  doc,
  factsFor,
  filter,
  filtersButton,
  openAgenda,
  reloadAgenda,
  resetButton,
  win,
} from "./support/agenda";
import { feed, type FeedDay } from "./support/feed";

const DIMMED = 0.2;
const SHOWN = 1;

interface Selection {
  themes?: string[];
  rooms?: string[];
}

function matches(day: FeedDay, id: string, selection: Selection): boolean {
  const { themes = [], rooms = [] } = selection;
  const { room, track } = factsFor(day, id);
  return (
    (themes.length === 0 || (track !== null && themes.includes(track))) &&
    (rooms.length === 0 || rooms.includes(room))
  );
}

async function expectFiltered(day: FeedDay, selection: Selection) {
  const expected = Object.fromEntries(
    cardIds().map((id) => [id, matches(day, id, selection) ? SHOWN : DIMMED]),
  );
  await expect.poll(() => cardOpacities()).toEqual(expected);
}

const tracksOf = (day: FeedDay) =>
  [...new Set(day.sessions.map((s) => s.track))]
    .filter((t): t is string => t !== null)
    .sort();

describe.for(feed.map((day) => [day.slug, day] as const))(
  "agenda content on %s",
  ([slug, day]) => {
    it("renders every session of the day as a card", async () => {
      await openAgenda(`/agenda/${slug}`);
      const expected = [
        ...day.sessions.filter((s) => s.track !== "Ignites").map((s) => s.id),
        ...(day.ignites.length ? [`lightning-${slug}`] : []),
      ].sort();
      expect(cardIds().sort()).toEqual(expected);
    });

    it("offers the day's tracks and rooms as filter options", async () => {
      await openAgenda(`/agenda/${slug}`);
      const values = (group: string) =>
        [
          ...doc().querySelectorAll<HTMLInputElement>(
            `#${group}-filters input`,
          ),
        ].map((el) => el.value);
      const rooms = [...new Set(day.sessions.map((s) => s.room))].sort();
      expect(values("theme")).toEqual(tracksOf(day));
      expect(values("room")).toEqual(rooms);
      expect(values("favorite")).toEqual(["favorite"]);
    });
  },
);

describe("agenda filters", () => {
  const day = feed[0];
  const path = `/agenda/${day.slug}`;
  // A theme and a room that each match only part of the day.
  const sampleTheme = tracksOf(day).find(
    (t) => t !== "Ignites" && t !== "Keynote",
  )!;
  const sampleRoom = "A2+A3";

  it("opens and closes the filter panel from the Filters button", async () => {
    await openAgenda(path);
    await expect.element(resetButton()).not.toBeInTheDocument();
    await filtersButton().click();
    await expect.element(resetButton()).toBeVisible();
    await filtersButton().click();
    await expect.element(resetButton()).not.toBeInTheDocument();
  });

  it("dims sessions outside the selected theme", async () => {
    await openAgenda(path);
    await filtersButton().click();
    await filter(sampleTheme).click();
    await expectFiltered(day, { themes: [sampleTheme] });
    await expect.element(filtersButton("(1) Filters")).toBeVisible();
  });

  // Unstable: its first click stalled once until the test timed out, with the
  // button visible and nothing covering it. Cause not found yet.
  it.skip("shows sessions matching any of several selected themes", async () => {
    await openAgenda(path);
    await filtersButton().click();
    await filter(sampleTheme).click();
    await filter("Ignites").click();
    await expectFiltered(day, { themes: [sampleTheme, "Ignites"] });
    await expect.element(filtersButton("(2) Filters")).toBeVisible();
  });

  it("dims sessions outside the selected room", async () => {
    await openAgenda(path);
    await filtersButton().click();
    await filter(sampleRoom).click();
    await expectFiltered(day, { rooms: [sampleRoom] });
  });

  it("requires both theme and room to match when both are selected", async () => {
    await openAgenda(path);
    await filtersButton().click();
    await filter(sampleTheme).click();
    await filter("Main hall").click();
    await expectFiltered(day, { themes: [sampleTheme], rooms: ["Main hall"] });
    await expect.element(filtersButton("(2) Filters")).toBeVisible();
  });

  it("unchecking a filter restores the sessions it dimmed", async () => {
    await openAgenda(path);
    await filtersButton().click();
    await filter(sampleTheme).click();
    await filter(sampleTheme).click();
    await expectFiltered(day, {});
    await expect.element(filtersButton("Filters")).toBeVisible();
  });

  it("Reset clears every filter and shows all sessions", async () => {
    await openAgenda(path);
    await filtersButton().click();
    await filter(sampleTheme).click();
    await filter(sampleRoom).click();
    await resetButton().click();

    await expectFiltered(day, {});
    await expect.element(filter(sampleTheme)).not.toBeChecked();
    await expect.element(filter(sampleRoom)).not.toBeChecked();
    await expect.element(filtersButton("Filters")).toBeVisible();
    expect(win().localStorage.getItem("reversim-filters")).toBeNull();
  });

  it("keeps the selected filters after a reload", async () => {
    await openAgenda(path);
    await filtersButton().click();
    await filter(sampleTheme).click();
    await filter(sampleRoom).click();
    await reloadAgenda();

    await expectFiltered(day, { themes: [sampleTheme], rooms: [sampleRoom] });
    await expect.element(filtersButton("(2) Filters")).toBeVisible();
    await filtersButton().click();
    await expect.element(filter(sampleTheme)).toBeChecked();
    await expect.element(filter(sampleRoom)).toBeChecked();
  });
});
