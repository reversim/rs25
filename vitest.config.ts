import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// The venue's timezone, which the site's times are written in. The browser and
// the Astro dev server both inherit it.
process.env.TZ = "Asia/Jerusalem";

const DESKTOP_TESTS = "tests/e2e/desktop.test.ts";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Starts the Astro dev server the agenda iframe loads from.
    globalSetup: ["tests/e2e/support/globalSetup.ts"],
    testTimeout: 10_000,
    browser: {
      enabled: true,
      // Show the page itself, at the project viewport, without the Vitest UI.
      ui: false,
      // `test:ci` overrides this with --browser.headless.
      headless: false,
      provider: playwright({
        // The site runs on another port; this lets tests read its DOM directly.
        launchOptions: {
          args: ["--disable-web-security", "--disable-site-isolation-trials"],
        },
      }),
      // Mobile is the main target; desktop only runs its smoke tests.
      instances: [
        {
          browser: "chromium",
          name: "mobile",
          viewport: { width: 390, height: 844 },
          exclude: [DESKTOP_TESTS],
        },
        {
          browser: "chromium",
          name: "desktop",
          viewport: { width: 1280, height: 900 },
          include: [DESKTOP_TESTS],
        },
      ],
    },
  },
});
