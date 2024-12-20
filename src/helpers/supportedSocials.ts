export const supportedSocials = {
  linkedin: "linkedin",
  twitter: "twitter",
  bluesky: "bluesky",
  facebook: "facebook",
  github: "github",
  instagram: "instagram",
  website: "website",
  medium: "medium",
  youtube: "youtube",
} as const;

export type supportedSocials = keyof typeof supportedSocials;
