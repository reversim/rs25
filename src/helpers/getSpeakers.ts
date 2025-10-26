import slug from "slug";
import type { AgendaSpeaker } from "./getAgenda";

export async function getSpeakers() {
  const result = await fetch(
    "https://sessionize.com/api/v2/fan6lxrk/view/Speakers",
  );

  const data: AgendaSpeaker[] = await result.json();
  const finalSpeakers = data.map((speaker) => ({
    ...speaker,
    slug: slug(speaker?.fullName || ""),
  }));
  return finalSpeakers;
}

export async function getSpeakerById(id: string): Promise<AgendaSpeaker> {
  const speakers = await getSpeakers();
  return speakers.find((speaker: AgendaSpeaker) => speaker.id === id) || { id: "", name: "" };
}
