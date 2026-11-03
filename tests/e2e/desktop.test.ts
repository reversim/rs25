import { describe, expect, it, vi } from "vitest";
import {
  agendaLocation,
  calendarButton,
  calendarOption,
  cardIds,
  cardOpacities,
  factsFor,
  filter,
  filtersButton,
  menuOptionCases,
  nowButton,
  openAgenda,
  slotAt,
  star,
  watchNavigation,
  win,
} from "./support/agenda";
import { feed } from "./support/feed";

// Smoke tests for the desktop grid; the other files cover behaviour in full on
// mobile, the main target.

const day = feed[0];
const path = `/agenda/${day.slug}`;

const talk = day.sessions.find(
  (s) => s.track && s.track !== "Ignites" && s.track !== "Keynote",
)!;
const keynote = day.sessions.find((s) => s.track === "Keynote")!;
const IGNITES = "Lightning Sessions";

async function openedUrl(title: string) {
  const open = vi.spyOn(win(), "open").mockReturnValue(null);
  await calendarButton(title).click();
  await calendarOption("Google").click();
  return new URL(open.mock.calls[0][0] as string);
}

describe("agenda on desktop", () => {
  it("renders every session of the day in the grid", async () => {
    await openAgenda(path);
    const expected = [
      ...day.sessions.filter((s) => s.track !== "Ignites").map((s) => s.id),
      `lightning-${day.slug}`,
    ].sort();
    expect(cardIds("desktop").sort()).toEqual(expected);
    await expect.element(star(talk.title)).toBeVisible();
  });

  it("dims sessions outside the selected theme", async () => {
    await openAgenda(path);
    await filtersButton().click();
    await filter(talk.track!).click();
    const expected = Object.fromEntries(
      cardIds("desktop").map((id) => [
        id,
        factsFor(day, id).track === talk.track ? 1 : 0.2,
      ]),
    );
    await expect.poll(() => cardOpacities("desktop")).toEqual(expected);
  });

  it("clicking the star likes the talk without opening its page", async () => {
    await openAgenda(path);
    const navigated = watchNavigation();
    await star(talk.title).click();
    await expect.element(star(talk.title, true)).toBeVisible();
    expect(navigated()).toBe(false);
    expect(agendaLocation()).toBe(path);
  });

  // Trial click: Playwright's actionability checks, without clicking. Guards
  // the menu hanging below a row against the next row painting over it.
  it.for(
    menuOptionCases([talk.title, keynote.title, "Opening Words", IGNITES]),
  )("$option can be clicked on $card", async ({ card, option }) => {
    await openAgenda(path);
    await calendarButton(card).click();
    await calendarOption(option).click({ trial: true });
  });

  it("the calendar menu opens the provider for the session", async () => {
    await openAgenda(path);
    const url = await openedUrl(talk.title);
    expect(url.searchParams.get("text")).toBe(talk.title);
  });

  it("the Ignites block's event has the room its talks share", async () => {
    await openAgenda(path);
    const url = await openedUrl(IGNITES);
    expect(url.searchParams.get("location")).toBe(day.ignites[0].room);
  });

  it("What's on now? scrolls to the current slot", async () => {
    await openAgenda(path, `${day.slug}T13:30:00`);
    await expect.element(slotAt("13:20")).not.toBeInViewport({ ratio: 1 });
    await nowButton().click();
    await expect
      .element(slotAt("13:20"), { timeout: 3_000 })
      .toBeInViewport({ ratio: 1 });
  });
});
