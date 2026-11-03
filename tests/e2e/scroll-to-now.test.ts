import { describe, expect, it } from "vitest";
import { type Locator } from "vitest/browser";
import {
  agendaLocation,
  doc,
  nowButton,
  openAgenda,
  slotAt,
  win,
} from "./support/agenda";
import { feed } from "./support/feed";

const [day1, day2] = feed;

// Which time slots contain highlighted elements, and how many there are.
const highlighted = () => {
  const els = [...doc().querySelectorAll(".highlight-slot")];
  return {
    slots: [...new Set(els.map((el) => el.parentElement!.id))],
    count: els.length,
  };
};

async function expectScrolledTo(slot: Locator) {
  await expect.element(slot, { timeout: 3_000 }).toBeInViewport({ ratio: 1 });
  const el = slot.element();
  // Every child of the slot except its time column/header.
  expect(highlighted()).toEqual({
    slots: [el.id],
    count: el.children.length - 1,
  });
}

// Starts with the target slot out of view, so a pass means the button actually
// scrolled.
async function scrollAwayFrom(slot: Locator) {
  win().scrollTo({ top: doc().body.scrollHeight });
  await expect.element(slot).not.toBeInViewport({ ratio: 1 });
}

describe("What's on now? button visibility", () => {
  it.for([
    ["before the conference", "2026-11-29T12:00:00"],
    ["after the conference", "2026-12-02T12:00:00"],
  ])("is hidden %s", async ([, now]) => {
    await openAgenda(`/agenda/${day1.slug}`, now);
    await expect.element(nowButton()).not.toBeInTheDocument();
  });

  it.for(feed.map((day) => day.slug))(
    "is shown on conference day %s",
    async (slug) => {
      await openAgenda(`/agenda/${slug}`, `${slug}T12:00:00`);
      await expect.element(nowButton()).toBeVisible();
    },
  );
});

describe("What's on now?", () => {
  it.for([
    ["the slot that started under 15 minutes ago", "11:15", "11:10"],
    ["the slot that just started", "10:05", "10:00"],
    ["lunch while it's on", "12:30", "12:20"],
    [
      "the next slot when the current one started 15+ minutes ago",
      "13:00",
      "13:20",
    ],
    ["the first slot before the day starts", "07:30", "08:00"],
  ])("scrolls to %s (at %s → %s)", async ([, at, target]) => {
    await openAgenda(`/agenda/${day1.slug}`, `${day1.slug}T${at}:00`);
    await scrollAwayFrom(slotAt(target));

    await nowButton().click();
    await expectScrolledTo(slotAt(target));
  });

  it("the highlight is a ~2s flash", async () => {
    await openAgenda(`/agenda/${day1.slug}`, `${day1.slug}T11:15:00`);
    await nowButton().click();
    await expectScrolledTo(slotAt("11:10"));
    await expect
      .poll(() => highlighted(), { timeout: 4_000 })
      .toEqual({ slots: [], count: 0 });
  });

  it("opens today's agenda when viewing another day", async () => {
    await openAgenda(`/agenda/${day1.slug}`, `${day2.slug}T11:15:00`);
    await nowButton().click();
    await expect.poll(agendaLocation).toBe(`/agenda/${day2.slug}?scroll=now`);
    await expectScrolledTo(slotAt("11:10"));
  });

  it("?scroll=now scrolls on load", async () => {
    await openAgenda(
      `/agenda/${day1.slug}?scroll=now`,
      `${day1.slug}T11:15:00`,
    );
    await expectScrolledTo(slotAt("11:10"));
  });

  it("/agenda?scroll=now redirects to today's day and scrolls", async () => {
    // /agenda renders one of the days; make "today" the other one.
    await openAgenda("/agenda");
    const shownDay = doc()
      .querySelector("#scroll-to-now-btn")!
      .getAttribute("data-day-slug");
    const today = shownDay === day1.slug ? day2 : day1;

    await openAgenda("/agenda?scroll=now", `${today.slug}T11:15:00`);
    await expect.poll(agendaLocation).toBe(`/agenda/${today.slug}?scroll=now`);
    await expectScrolledTo(slotAt("11:10"));
  });
});
