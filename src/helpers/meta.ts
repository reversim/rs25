// Helpers for building the per-page link-preview metadata (Open Graph /
// Twitter cards) rendered by Layout.astro.

export const SITE_NAME = "Reversim Summit 2026";

/** Size of the per-page preview cards (JPEG) drawn by helpers/og/ogCard.ts. */
export const OG_CARD = { width: 1200, height: 630 };

/** Where a speaker's or session's preview card is published. */
export const ogCardPath = (kind: "speaker" | "session", slug: string) =>
  `/og/${kind}/${slug}.jpg`;

const RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
const LTR_CHAR = /[A-Za-z\u00C0-\u024F]/;
// Right-to-left mark: keeps trailing punctuation of Hebrew text on the
// correct side when a preview renders it in a left-to-right context.
const RLM = "\u200F";

/** True when the text's first strong-direction character is right-to-left. */
function isRtl(text: string): boolean {
  for (const char of text) {
    if (RTL_CHAR.test(char)) return true;
    if (LTR_CHAR.test(char)) return false;
  }
  return false;
}

/** Appends a right-to-left mark to RTL text so previews render it intact. */
export function withDirectionMark(text: string): string {
  return isRtl(text) ? `${text}${RLM}` : text;
}

/** Collapses whitespace and cuts the text to `max` characters on a word boundary. */
export function excerpt(text: string | null | undefined, max = 200): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  // Count code points, not UTF-16 units, so emoji are never split in half.
  const chars = Array.from(clean);
  if (chars.length <= max) return clean;
  const cut = chars.slice(0, max).join("");
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.\-\u2013\u2014]+$/, "")}…`;
}

/** Joins names as "A", "A & B" or "A, B & C". */
export function joinNames(names: string[]): string {
  const list = names.filter(Boolean);
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} & ${list[list.length - 1]}`;
}
