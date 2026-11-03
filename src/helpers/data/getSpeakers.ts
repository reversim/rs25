import slug from "slug";
import type { AgendaSpeaker } from "../../types/agenda";
import speakersDay from "../../data/speakersDay.json";

export async function getSpeakers(): Promise<AgendaSpeaker[]> {
  const result = await fetch(
    "https://sessionize.com/api/v2/1saptwag/view/Speakers",
  );

  const data: AgendaSpeaker[] = await result.json();
  const speakers = data.map((speaker) => {
    const { day = 1 } =
      speakersDay.find(
        (s: { speakerId: string }) => s.speakerId === speaker.id,
      ) || speaker;
    return {
      ...speaker,
      slug: slug(speaker?.fullName || ""),
      day,
    };
  });

  return shuffle(speakers);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function getSpeakerById(id: string): Promise<AgendaSpeaker> {
  const speakers = await getSpeakers();
  return (
    speakers.find((speaker: AgendaSpeaker) => speaker.id === id) || {
      id: "",
      name: "",
    }
  );
}
