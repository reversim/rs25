import slug from "slug";
import sponsorsData from "./sponsersData.json";

export interface sponsorData {
  sponsorTier: "organizing" | "regular";
  companyName: string;
  description: string;
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

export async function getSponsors(
  type: "organizing" | "regular" | "all" = "all"
) {
  let finalSponsors = sponsorsData;
  if (type === "organizing") {
    finalSponsors = sponsorsData.filter(
      (sponsor) => sponsor.sponsorTier === "organizing"
    );
  }
  if (type === "regular") {
    finalSponsors = sponsorsData.filter(
      (sponsor) => sponsor.sponsorTier === "regular"
    );
  }

  return finalSponsors.map((sponsor) => {
    const sponsorSlug = slug(sponsor.companyName);

    const testimonials = (
      sponsor.testimonials as sponsorData["testimonials"]
    ).map((testimonial) => {
      return {
        ...testimonial,
        image: import(
          `../assets/sponsors/${sponsorSlug}/${testimonial.image}.png`
        ),
      };
    });

    const carouselImages = sponsor.carouselImages.map((image) => {
      return import(`../assets/sponsors/${sponsorSlug}/${image}.png`);
    });

    return {
      ...sponsor,
      slug: sponsorSlug,
      companyNameLogo: import(`../assets/sponsors/${sponsorSlug}/logo.png`),
      testimonials,
      carouselImages,
    };
  });
}
