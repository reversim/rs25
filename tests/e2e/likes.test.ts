import { describe, expect, it } from "vitest";
import {
  agenda,
  agendaLocation,
  cardIds,
  cardOpacities,
  filter,
  filtersButton,
  openAgenda,
  reloadAgenda,
  resetButton,
  star,
  watchNavigation,
  win,
} from "./support/agenda";
import { feed } from "./support/feed";

const day = feed[0];
const path = `/agenda/${day.slug}`;
const talks = day.sessions.filter(
  (s) => s.track && s.track !== "Ignites" && s.track !== "Keynote",
);
const keynote = day.sessions.find((s) => s.track === "Keynote")!;
const [first, second] = talks;

const stored = () =>
  JSON.parse(
    win().localStorage.getItem("reversim-liked-talks") ?? "[]",
  ) as string[];

describe("liking talks", () => {
  it("clicking the star likes the talk and clicking again unlikes it", async () => {
    await openAgenda(path);
    await expect.element(star(first.title, false)).toBeVisible();

    await star(first.title).click();
    await expect.element(star(first.title, true)).toBeVisible();
    expect(stored()).toEqual([first.id]);

    await star(first.title).click();
    await expect.element(star(first.title, false)).toBeVisible();
    expect(stored()).toEqual([]);
  });

  it("keeps likes after a reload", async () => {
    await openAgenda(path);
    await star(first.title).click();
    await star(second.title).click();
    await reloadAgenda();

    await expect.element(star(first.title, true)).toBeVisible();
    await expect.element(star(second.title, true)).toBeVisible();
    expect(stored()).toEqual([first.id, second.id]);
  });

  it.for([
    ["a talk", first],
    ["the keynote", keynote],
  ] as const)("marks %s liked in the desktop layout too", async ([, talk]) => {
    await openAgenda(path);
    await star(talk.title).click();
    // The second match is the hidden desktop layout's star.
    await expect
      .element(
        agenda
          .getByRole("button", {
            name: `Like ${talk.title}`,
            pressed: true,
            includeHidden: true,
          })
          .nth(1),
      )
      .toBeInTheDocument();
  });

  it("liking does not open the session page", async () => {
    await openAgenda(path);
    const navigated = watchNavigation();
    await star(first.title).click();
    expect(navigated()).toBe(false);
    expect(agendaLocation()).toBe(path);
  });

  it("stars are disabled while a filter is active and work again after Reset", async () => {
    await openAgenda(path);
    await filtersButton().click();
    await filter(first.track!).click();
    await expect.element(star(first.title)).toBeDisabled();

    await resetButton().click();
    await expect.element(star(first.title)).toBeEnabled();
    await star(first.title).click();
    expect(stored()).toEqual([first.id]);
  });

  it("the Favorites filter shows only liked talks", async () => {
    await openAgenda(path);
    await star(first.title).click();
    await star(second.title).click();
    await filtersButton().click();
    await filter("Favorites").click();

    const expected = Object.fromEntries(
      cardIds().map((id) => [
        id,
        id === first.id || id === second.id ? 1 : 0.2,
      ]),
    );
    await expect.poll(() => cardOpacities()).toEqual(expected);
  });
});
