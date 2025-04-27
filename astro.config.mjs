// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import partytown from "@astrojs/partytown";

// https://astro.build/config
export default defineConfig({
  prefetch: true,
  site: "https://summit2025.reversim.com",

  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Montserrat",
        cssVariable: "--font-montserrat",
        weights: ["100..900"],
        styles: ["normal"],
        display: "swap",
      },
    ],
  },
  integrations: [
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
});
