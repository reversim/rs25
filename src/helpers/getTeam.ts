import slug from "slug";
import teamData from "./teamData.json";

export interface teamMember {
  slug: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  linkedin?: string;
  twitter?: string;
  bluesky?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  medium?: string;
  website?: string;
  image: Promise<any>;
}

export async function getTeamMembers() {
  return teamData.map((member) => {
    const memberSlug = slug(member.name);

    return {
      ...member,
      slug: memberSlug,
      image: import(`../assets/team/${memberSlug}.png`),
    };
  });
}
