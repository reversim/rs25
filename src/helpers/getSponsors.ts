import slug from "slug";
import sponsorsJson from "./sponsersData.json";

export interface sponsorData {
  sponsorTier: "organizing" | "game-changers" | "community";
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
  openJobsLink?: string;
}

// Helper function to try importing an image with different extensions
async function tryImportImage(basePath: string): Promise<any> {
  const extensions = ["png", "jpg", "jpeg"];

  for (const ext of extensions) {
    try {
      const imagePath = `${basePath}.${ext}`;
      return await import(imagePath);
    } catch (error) {
      // Continue to next extension
    }
  }

  // If no extension works, fall back to png (original behavior)
  return import(`${basePath}.png`);
}

export async function getSponsors(type?: sponsorData["sponsorTier"]) {
  const sponsorsData = sponsorsJson.sponsors;
  let finalSponsors = sponsorsData;
  if (type === "organizing") {
    finalSponsors = sponsorsData.filter(
      (sponsor) => sponsor.sponsorTier === "organizing"
    );
  }
  if (type === "community") {
    finalSponsors = sponsorsData.filter(
      (sponsor) => sponsor.sponsorTier === "community"
    );
  }
  if (type === "game-changers") {
    finalSponsors = sponsorsData.filter(
      (sponsor) => sponsor.sponsorTier === "game-changers"
    );
  }

  return finalSponsors.map((sponsor) => {
    const sponsorSlug = slug(sponsor.companyName);

    const testimonials = (
      sponsor.testimonials as sponsorData["testimonials"]
    ).map((testimonial) => {
      return {
        ...testimonial,
        image: tryImportImage(  
          `../assets/sponsors/${sponsorSlug}/${testimonial.image}`
        ),
      };
    });

    const carouselImages = sponsor.carouselImages?.map((image) => {
      return tryImportImage(`../assets/sponsors/${sponsorSlug}/${image}`);
    });

    return {
      ...sponsor,
      slug: sponsorSlug,
      companyNameLogo: tryImportImage(`../assets/sponsors/${sponsorSlug}/logo`),
      testimonials,
      carouselImages,
    };
  });
}
