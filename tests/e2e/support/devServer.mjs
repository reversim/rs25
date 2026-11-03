// Runs the Astro dev server for the e2e tests in its own process. It can't run
// inside Vitest: Astro skips its page-serving middleware whenever VITEST is set.
// Pages render in this process too, so MSW answers their Sessionize requests
// from the mock feed without the site's code knowing about tests.
// Prints `ready <port>` once listening and stops cleanly on SIGTERM.
import { dev } from "astro";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import fixture from "../fixtures/agenda.json" with { type: "json" };

const mocks = setupServer(
  http.get("https://sessionize.com/api/v2/*/view/GridSmart", () =>
    HttpResponse.json(fixture),
  ),
);
mocks.listen({ onUnhandledRequest: "warn" });

const server = await dev({
  root: process.argv[2],
  logLevel: "warn",
  server: { port: Number(process.argv[3]) },
  // Every agenda load would otherwise make the dev server render the pages in
  // the nav too, each with its own live requests and image processing.
  prefetch: false,
  // The dev-only toolbar is pinned over the bottom of the page; visitors
  // never see it, so it must not block clicks in the tests either.
  devToolbar: { enabled: false },
});
console.log(`ready ${server.address.port}`);

process.on("SIGTERM", async () => {
  await server.stop();
  mocks.close();
  process.exit(0);
});
