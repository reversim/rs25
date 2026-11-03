// Single source of truth for paths that should redirect elsewhere rather
// than render. The page still builds normally (so the source stays intact
// for later), but Layout.astro swaps its output for a redirect whenever the
// current route matches an entry here. A bare path blocks it outright
// (redirecting to /404); give it a `to` instead to send visitors somewhere
// specific, e.g. a route that moved.
export interface Redirect {
  from: string;
  to: string;
}

export type RedirectRule = string | Redirect;

// IMPORTANT: firebase.json mirrors these as server-side redirects (skipping the stub
// IMPORTANT: page load); keep its `redirects` in sync when changing this list.
export const redirects: RedirectRule[] = [];

// Preview builds (`npm run deploy:preview`) render every hidden page so the team
// can review it before launch.
export const isPreview = import.meta.env.PUBLIC_PREVIEW === "true";

// "/agenda" also matches nested routes like "/agenda/day-1".
export function getRedirectTarget(pathname: string): string | undefined {
  if (isPreview) return undefined;
  const path = pathname.replace(/\/+$/, "") || "/";
  const rule = redirects.find((entry) => {
    const from = typeof entry === "string" ? entry : entry.from;
    return path === from || path.startsWith(`${from}/`);
  });
  if (!rule) return undefined;
  return typeof rule === "string" ? "/404" : rule.to;
}
