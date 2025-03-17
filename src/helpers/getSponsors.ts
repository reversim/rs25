import slug from "slug";
import sponsorsData from "./sponsersData.json";

export interface sponsorData {
  companyName: string;
  desorption: string;
  website: string;
  companyNameLogo: string;
  carouselImages: string[];
  technologyStack: string[];
  openPositions: { position: string; location: string; positionLink: string }[];
  testimonials: {
    image: string;
    testimonialDescription: string;
    testimonialAuthor: string;
    position: string;
  }[];
  linkedin: string;
  bluesky: string;
  facebook: string;
  twitter: string;
  meetup: string;
  instagram: string;
  youtube: string;
  github: string;
  medium: string;
  image: any;
  slug: string;
}

export async function getSponsors() {
  return sponsorsData.map((sponsor) => {
    const sponsorSlug = slug(sponsor.companyName);

    return {
      ...sponsor,
      slug: sponsorSlug,
      image: import(`../assets/sponsors/${sponsorSlug}/logo.png`),
    };
  });
}
