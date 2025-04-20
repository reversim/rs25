// @ts-check
import { defineConfig } from "astro/config";
import partytown from "@astrojs/partytown";

// https://astro.build/config
export default defineConfig({
  prefetch: true,
  experimental: {
    svg: true,
  },
  integrations: [
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
});
