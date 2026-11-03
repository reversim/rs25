import { afterEach, inject } from "vitest";
import { cdp, page } from "vitest/browser";
import { venueTime, type FeedDay } from "./feed";

// Cards the filters act on, by layout. Both layouts are always in the DOM;
// CSS shows one of them depending on the viewport.
const CARDS = {
  mobile: ".session-card[data-talk-id]",
  desktop:
    ".session-content[data-talk-id], .full-width-session-cell[data-talk-id]",
};
export type Layout = keyof typeof CARDS;

// Before the conference, so nothing depends on the real date unless a test
// sets a time of its own.
const DEFAULT_NOW = "2026-11-29T12:00:00";

// Runs before the page's own scripts on every load of the agenda iframe, the
// only point early enough to freeze the Date they read (timers keep running).
// Also turns motion off, so nothing is still moving when a test clicks it.
const PREPARE_AGENDA = `{
  const now = window.frameElement?.dataset.now;
  if (now) {
    const noMotion = new CSSStyleSheet();
    noMotion.replaceSync(
      "* { scroll-behavior: auto !important; transition: none !important; animation: none !important; }",
    );
    document.adoptedStyleSheets = [noMotion];
    const RealDate = Date;
    window.Date = class extends RealDate {
      constructor(...args) {
        args.length ? super(...args) : super(Number(now));
      }
      static now() {
        return Number(now);
      }
    };
  }
}`;

const FRAME_TITLE = "Agenda";

let pagePrepared = false;
let iframe: HTMLIFrameElement | undefined;

// Locators inside the agenda page, for interacting the way a user does.
export const agenda = page.frameLocator(page.getByTitle(FRAME_TITLE));

export const nowButton = () =>
  agenda.getByRole("button", { name: "What's on now?" });
export const resetButton = () => agenda.getByRole("button", { name: "Reset" });
// The name starts with a count, like "(2) Filters", while filters are active.
export const filtersButton = (name: string | RegExp = /Filters$/) =>
  agenda.getByRole("button", { name, exact: typeof name === "string" });
export const filter = (name: string) =>
  agenda.getByRole("checkbox", { name, exact: true });
export const star = (title: string, pressed?: boolean) =>
  agenda.getByRole("button", { name: `Like ${title}`, pressed });
export const calendarButton = (title: string, expanded?: boolean) =>
  agenda.getByRole("button", { name: `Add ${title} to calendar`, expanded });
// Only the open menu's options are visible, so the label alone is unambiguous.
export const calendarOption = (label: string) =>
  agenda.getByRole("button", { name: label, exact: true });
// The time slot that starts at `hhmm`, in whichever layout is showing.
export const slotAt = (hhmm: string) =>
  agenda.getByRole("group", { name: `Sessions at ${hhmm}`, exact: true });

// The agenda page itself, for values no matcher covers.
export const doc = () => iframe!.contentDocument!;
export const win = () => iframe!.contentWindow as Window & typeof globalThis;

const loaded = (el: HTMLIFrameElement) =>
  new Promise<void>((resolve) =>
    el.addEventListener("load", () => resolve(), { once: true }),
  );

// `now` is the venue wall time Date is frozen at, e.g. "2026-11-30T11:15:00".
export async function openAgenda(path: string, now = DEFAULT_NOW) {
  if (!pagePrepared) {
    await cdp().send("Page.enable");
    await cdp().send("Page.addScriptToEvaluateOnNewDocument", {
      source: PREPARE_AGENDA,
    });
    pagePrepared = true;
  }
  iframe?.remove();
  iframe = document.createElement("iframe");
  iframe.title = FRAME_TITLE;
  iframe.dataset.now = String(venueTime(now).getTime());
  iframe.style.cssText =
    "display: block; border: 0; width: 100%; height: 100vh";
  iframe.src = new URL(path, inject("baseURL")).href;
  const done = loaded(iframe);
  document.body.append(iframe);
  await done;
}

export async function reloadAgenda() {
  const done = loaded(iframe!);
  win().location.reload();
  await done;
}

export const agendaLocation = () =>
  win().location.pathname + win().location.search;

// Every test starts from an empty localStorage.
afterEach(() => {
  if (!iframe) return;
  win().localStorage.clear();
  iframe.remove();
  iframe = undefined;
});

// Records whether the page started navigating away, so a test can assert a
// click did NOT trigger a card's onclick navigation.
export function watchNavigation() {
  let navigated = false;
  win().addEventListener("beforeunload", () => {
    navigated = true;
  });
  return () => navigated;
}

export const cardIds = (layout: Layout = "mobile") =>
  [...doc().querySelectorAll(CARDS[layout])].map(
    (el) => el.getAttribute("data-talk-id")!,
  );

// Opacity of every card, keyed by session id.
export const cardOpacities = (layout: Layout = "mobile") =>
  Object.fromEntries(
    [...doc().querySelectorAll(CARDS[layout])].map((el) => [
      el.getAttribute("data-talk-id")!,
      Number(win().getComputedStyle(el).opacity),
    ]),
  );

export interface SessionFacts {
  room: string;
  track: string | null;
}

// What a card on the page represents, according to the feed. The site groups
// a day's Ignites talks into one synthetic `lightning-<day>` card.
export function factsFor(day: FeedDay, id: string): SessionFacts {
  if (id === `lightning-${day.slug}`) {
    return { room: day.ignites[0].room, track: "Ignites" };
  }
  const session = day.sessions.find((s) => s.id === id);
  if (!session) throw new Error(`Card ${id} is not a session in the feed`);
  return session;
}

// Every option of the calendar menu on the given cards, one test case each.
export const menuOptionCases = (cards: string[]) =>
  cards.flatMap((card) =>
    ["Google", "Outlook", "Yahoo", "Apple/iCal (.ics)"].map((option) => ({
      card,
      option,
    })),
  );
