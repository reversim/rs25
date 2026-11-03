import { describe, expect, it, vi } from "vitest";
import {
  agenda,
  agendaLocation,
  calendarButton,
  calendarOption,
  menuOptionCases,
  openAgenda,
  watchNavigation,
  win,
} from "./support/agenda";
import { feed } from "./support/feed";

// What each provider's URL and .ics file contain is covered by
// tests/unit/addToCalendar.test.ts; these check the menu that leads to them.

const day = feed[0];
const path = `/agenda/${day.slug}`;

const talk = day.sessions.find(
  (s) => s.track && s.track !== "Ignites" && s.track !== "Keynote",
)!;
const keynote = day.sessions.find((s) => s.track === "Keynote")!;
const IGNITES = "Lightning Sessions";

const expectMenuOpen = (title: string) =>
  expect.element(calendarButton(title, true)).toBeVisible();
const expectMenuClosed = (title: string) =>
  expect.element(calendarButton(title, false)).toBeVisible();

// Opens the menu and picks a provider that opens a new tab; returns its URL.
async function openedUrl(title: string, option: string) {
  const open = vi.spyOn(win(), "open").mockReturnValue(null);
  await calendarButton(title).click();
  await calendarOption(option).click();
  expect(open).toHaveBeenCalledOnce();
  expect(open.mock.calls[0][1]).toBe("_blank");
  return new URL(open.mock.calls[0][0] as string);
}

describe("add to calendar", () => {
  it("the calendar button opens the provider menu", async () => {
    await openAgenda(path);
    await expectMenuClosed(talk.title);
    await expect.element(calendarOption("Google")).not.toBeInTheDocument();

    await calendarButton(talk.title).click();
    await expectMenuOpen(talk.title);
    await expect.element(calendarOption("Google")).toBeVisible();
    await expect.element(calendarOption("Outlook")).toBeVisible();
    await expect.element(calendarOption("Yahoo")).toBeVisible();
    await expect.element(calendarOption("Apple/iCal (.ics)")).toBeVisible();
  });

  it("clicking the button again closes the menu", async () => {
    await openAgenda(path);
    await calendarButton(talk.title).click();
    await calendarButton(talk.title).click();
    await expectMenuClosed(talk.title);
    await expect.element(calendarOption("Google")).not.toBeInTheDocument();
  });

  it("clicking outside closes the menu", async () => {
    await openAgenda(path);
    await calendarButton(talk.title).click();
    await agenda.getByRole("heading", { level: 2 }).first().click();
    await expectMenuClosed(talk.title);
    await expect.element(calendarOption("Google")).not.toBeInTheDocument();
  });

  it("opening another session's menu closes the first one", async () => {
    await openAgenda(path);
    await calendarButton(talk.title).click();
    await calendarButton(keynote.title).click();
    await expectMenuClosed(talk.title);
    await expectMenuOpen(keynote.title);
  });

  // The trial click runs Playwright's real actionability checks (visible,
  // stable, receives the pointer: not covered by another element) without
  // clicking, so it fails exactly when a user couldn't click the option.
  it.for(
    menuOptionCases([talk.title, keynote.title, "Opening Words", IGNITES]),
  )("$option can be clicked on $card", async ({ card, option }) => {
    await openAgenda(path);
    await calendarButton(card).click();
    await calendarOption(option).click({ trial: true });
  });

  it("using the menu does not open the session page", async () => {
    await openAgenda(path);
    const navigated = watchNavigation();
    await openedUrl(talk.title, "Google");
    expect(navigated()).toBe(false);
    expect(agendaLocation()).toBe(path);
  });

  it.for([
    ["Google", "https://calendar.google.com/calendar/render", "text"],
    [
      "Outlook",
      "https://outlook.live.com/calendar/0/deeplink/compose",
      "subject",
    ],
    ["Yahoo", "https://calendar.yahoo.com/", "title"],
  ])(
    "%s opens the provider for the clicked session",
    async ([option, target, titleParam]) => {
      await openAgenda(path);
      const url = await openedUrl(talk.title, option);
      expect(url.origin + url.pathname).toBe(target);
      expect(url.searchParams.get(titleParam)).toBe(talk.title);
      await expectMenuClosed(talk.title);
    },
  );

  it("Apple/iCal downloads an .ics file for the session", async () => {
    await openAgenda(path);
    const createUrl = vi.spyOn(win().URL, "createObjectURL");
    let fileName = "";
    vi.spyOn(win().HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        fileName = this.download;
      },
    );

    await calendarButton(talk.title).click();
    await calendarOption("Apple/iCal (.ics)").click();

    expect(fileName).toBe(`${talk.title.replace(/[^a-z0-9]/gi, "_")}.ics`);
    const blob = createUrl.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/calendar");
    expect(await blob.text()).toContain(`UID:${talk.id}@reversim.com`);
    await expectMenuClosed(talk.title);
  });
});
