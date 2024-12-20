import slug from "slug";

export interface speaker {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  tagLine: string;
  bio: string;
  profilePicture: string;
  slug: string;
  isTopSpeaker: boolean;
  sessions: any[];
  links: any[];
}

export async function getSpeakers() {
  const result = await fetch(
    "https://sessionize.com/api/v2/qjyi27ms/view/Speakers"
  );

  const data: speaker[] = await result.json();
  const finalSpeakers = data.map((speaker) => ({
    ...speaker,
    slug: slug(speaker.fullName),
  }));
  return finalSpeakers;
}
