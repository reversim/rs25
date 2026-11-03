import { describe, expect, it, vi } from "vitest";
import { agenda, openAgenda, win } from "./support/agenda";
import { feed } from "./support/feed";

const day = feed[0];
const path = `/agenda/${day.slug}`;
const talk = day.sessions.find(
  (s) => s.track && s.track !== "Ignites" && s.track !== "Keynote",
)!;
const keynote = day.sessions.find((s) => s.track === "Keynote")!;
const ignite = day.ignites[0];

describe("session_select from the agenda", () => {
  it.for([
    ["a talk", talk.title],
    ["a keynote", keynote.title],
    ["an Ignite", ignite.title],
  ])("is recorded when opening %s", async ([_label, title]) => {
    await openAgenda(path);
    const debug = vi.spyOn(win().console, "debug");
    await agenda.getByRole("link", { name: title, exact: true }).click();
    expect(debug).toHaveBeenCalledWith(
      "[analytics]",
      "session_select",
      expect.objectContaining({
        session_title: title,
        session_source: "agenda",
      }),
    );
  });
});
