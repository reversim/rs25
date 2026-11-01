// Build-time link-preview cards (Open Graph images) for speaker and session
// pages, drawn with sharp in the speaker kit's visual language.
//
// Text goes through libvips' Pango renderer with the fonts bundled in
// src/assets/og-fonts, so cards look the same on every machine and Hebrew
// titles get proper bidi layout (Heebo is the fallback for Hebrew glyphs).

import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import { C, EVENT_DATES, SITE_SHORT, rng } from "../speakerKit/draw";
import { OG_CARD } from "../meta";

const { width: W, height: H } = OG_CARD;
const PAD = 64;

// ---------------------------------------------------------------- fonts

// Pango (on macOS it would otherwise use CoreText and ignore our fonts) and
// fontconfig read these lazily on the first text render, so they're set before
// any card is drawn. The build runs from the project root.
const FONTS_DIR = path.resolve("src/assets/og-fonts");
const fontsConf = path.join(tmpdir(), "rs26-og-fonts.conf");
writeFileSync(
  fontsConf,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONTS_DIR}</dir>
  <cachedir>${path.join(tmpdir(), "rs26-og-fontcache")}</cachedir>
</fontconfig>`,
);
process.env.FONTCONFIG_FILE = fontsConf;
process.env.PANGOCAIRO_BACKEND = "fc";

// Heebo follows every family so Hebrew always renders.
const FAMILY = {
  display: "Space Grotesk, Heebo",
  mono: "JetBrains Mono, Heebo",
};

// ---------------------------------------------------------------- text

interface TextSpec {
  family?: keyof typeof FAMILY;
  weight?: number;
  size: number;
  /** Shrinks towards this size until the text fits `maxHeight`. */
  minSize?: number;
  color: string;
  /** Letter spacing, as a fraction of the font size. */
  spacing?: number;
  /** Line height, as a multiple of the font size. */
  lh?: number;
  maxWidth: number;
  maxHeight?: number;
}

interface TextImage {
  data: Buffer;
  width: number;
  height: number;
}

const escapeMarkup = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// No emoji font is bundled, so emoji are dropped rather than drawn as boxes.
const EMOJI = /\s*[\p{Extended_Pictographic}‍️]+/gu;
const clean = (s: string) => s.replace(EMOJI, "").replace(/\s+/g, " ").trim();

async function renderText(text: string, spec: TextSpec): Promise<TextImage> {
  const {
    family = "display",
    weight = 400,
    color,
    spacing = 0,
    lh = 1.15,
  } = spec;
  const minSize = spec.minSize ?? spec.size;
  for (let size = spec.size; ; size -= 2) {
    const markup = `<span foreground="${color}" font_weight="${weight}" letter_spacing="${Math.round(spacing * size * 1024)}">${escapeMarkup(clean(text))}</span>`;
    const { data, info } = await sharp({
      text: {
        text: markup,
        font: `${FAMILY[family]} ${size}`,
        width: spec.maxWidth,
        dpi: 72, // 1pt = 1px
        spacing: Math.round(size * (lh - 1)),
        wrap: "word",
        rgba: true,
      },
    })
      .png()
      .toBuffer({ resolveWithObject: true });
    if (!spec.maxHeight || info.height <= spec.maxHeight || size <= minSize) {
      return { data, width: info.width, height: info.height };
    }
  }
}

// ---------------------------------------------------------------- shapes

interface Anchor {
  x: number;
  y: number;
  r: number;
}

/** Navy backdrop with the hero's glow, dot grid, stars and node graph. */
function backdropSvg(seed: string, anchors: Anchor[]): string {
  const rand = rng(seed);
  const parts: string[] = [];

  const stars = Math.round((W * H) / 9000);
  for (let i = 0; i < stars; i++) {
    parts.push(
      `<circle cx="${rand() * W}" cy="${rand() * H}" r="${0.8 + rand() * 1.6}" fill="rgba(200,214,245,${0.15 + rand() * 0.5})"/>`,
    );
  }

  // Node graph around the photos, as in the speaker kit's constellation().
  const colors = [C.blue, C.mint, C.orange, C.pink, C.blueBright];
  // Kept clear of the text column on the left.
  const box = { x: W * 0.6, y: 30, w: W * 0.4 - 30, h: H - 60 };
  const nodes: (Anchor & { anchor?: boolean; color?: string })[] = anchors.map(
    (a) => ({ ...a, anchor: true }),
  );
  for (
    let tries = 0;
    nodes.length < anchors.length + 8 && tries < 400;
    tries++
  ) {
    const p = { x: box.x + rand() * box.w, y: box.y + rand() * box.h };
    const clear = nodes.every(
      (o) => Math.hypot(o.x - p.x, o.y - p.y) > (o.anchor ? o.r + 40 : 70),
    );
    if (clear) {
      nodes.push({
        ...p,
        r: 4 + rand() * 4,
        color: colors[Math.floor(rand() * colors.length)],
      });
    }
  }
  const edges = new Set<string>();
  nodes.forEach((n, i) => {
    nodes
      .map((o, j): [number, number] => [j, Math.hypot(o.x - n.x, o.y - n.y)])
      .filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1])
      .slice(0, rand() < 0.5 ? 2 : 1)
      .forEach(([j]) => edges.add(i < j ? `${i}-${j}` : `${j}-${i}`));
  });
  const edgeList = [...edges].map((e) => e.split("-").map(Number));
  const hot = Math.floor(rand() * edgeList.length);
  edgeList.forEach(([a, b], i) => {
    parts.push(
      `<line x1="${nodes[a].x}" y1="${nodes[a].y}" x2="${nodes[b].x}" y2="${nodes[b].y}" stroke="${i === hot ? "rgba(240,122,35,0.75)" : "rgba(132,162,218,0.3)"}" stroke-width="${i === hot ? 2.5 : 1.5}"/>`,
    );
  });
  for (const n of nodes) {
    if (n.anchor) {
      // The photo's glow and orange ring; the photo is composited inside it.
      parts.push(
        `<circle cx="${n.x}" cy="${n.y}" r="${n.r + 10}" fill="${C.orange}" opacity="0.35" filter="url(#glow)"/>`,
        `<circle cx="${n.x}" cy="${n.y}" r="${n.r + 6}" fill="${C.orange}"/>`,
      );
    } else {
      parts.push(
        `<circle cx="${n.x}" cy="${n.y}" r="${n.r * 1.8}" fill="${n.color}" opacity="0.45" filter="url(#glow)"/>`,
        `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.color}" stroke="rgba(255,255,255,0.55)" stroke-width="1.5"/>`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bg" cx="${W * 0.8}" cy="${H * 0.15}" r="${W * 0.9}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#182c63"/>
      <stop offset="0.55" stop-color="${C.navy}"/>
      <stop offset="1" stop-color="${C.navy2}"/>
    </radialGradient>
    <pattern id="dots" x="20" y="20" width="32" height="32" patternUnits="userSpaceOnUse">
      <rect width="2" height="2" fill="rgba(132,162,218,0.07)"/>
    </pattern>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="12"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  ${parts.join("\n  ")}
</svg>`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** A circular photo, or the speaker's initials when it can't be fetched. */
async function photoCircle(
  src: string | undefined,
  name: string,
  { x, y, r }: Anchor,
): Promise<OverlayOptions[]> {
  const d = r * 2;
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><circle cx="${r}" cy="${r}" r="${r}"/></svg>`,
  );
  const at = { left: Math.round(x - r), top: Math.round(y - r) };

  const photo = src ? await fetchImage(src) : null;
  if (photo) {
    const data = await sharp(photo)
      .resize(d, d, { fit: "cover", position: "attention" })
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
    return [{ input: data, ...at }];
  }

  const disc = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><circle cx="${r}" cy="${r}" r="${r}" fill="${C.panel2}"/></svg>`,
  );
  const letters = await renderText(initials(name), {
    weight: 700,
    size: Math.round(r * 0.64),
    color: C.blueBright,
    maxWidth: d,
  });
  return [
    { input: disc, ...at },
    {
      input: letters.data,
      left: Math.round(x - letters.width / 2),
      top: Math.round(y - letters.height / 2),
    },
  ];
}

async function fetchImage(src: string): Promise<Buffer | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

let logo: Promise<Buffer> | undefined;
const loadLogo = () =>
  (logo ??= sharp(path.resolve("src/assets/rs-26-logo.png"))
    .resize({ width: 300 })
    .png()
    .toBuffer());

// ---------------------------------------------------------------- layout

interface Block {
  text: TextImage;
  /** Space above this block. */
  gap: number;
}

/** Stacks text blocks top-down from (x, y); returns their overlays. */
function stack(blocks: Block[], x: number, y: number): OverlayOptions[] {
  let top = y;
  return blocks.map(({ text, gap }) => {
    top += gap;
    const overlay = { input: text.data, left: x, top: Math.round(top) };
    top += text.height;
    return overlay;
  });
}

const eyebrow = (text: string) =>
  renderText(text.toUpperCase(), {
    family: "mono",
    weight: 500,
    size: 22,
    spacing: 0.08,
    color: C.orange,
    maxWidth: 640,
  });

async function compose(
  seed: string,
  anchors: Anchor[],
  overlays: OverlayOptions[],
): Promise<Buffer> {
  const footer = await renderText(`${EVENT_DATES}  ·  ${SITE_SHORT}`, {
    family: "mono",
    weight: 500,
    size: 20,
    spacing: 0.04,
    color: C.muted,
    maxWidth: 700,
  });
  return sharp(Buffer.from(backdropSvg(seed, anchors)))
    .composite([
      { input: await loadLogo(), left: PAD, top: 48 },
      ...overlays,
      { input: footer.data, left: PAD, top: H - 48 - footer.height },
    ])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

// The text column: from below the logo down to the footer.
const COL_TOP = 150;
const COL_BOTTOM = H - 100;
const COL_WIDTH = 620;

// ---------------------------------------------------------------- cards

export interface OgSpeaker {
  name: string;
  tagLine?: string;
  photo?: string;
}

export async function speakerCard({
  slug,
  speaker,
  talks,
}: {
  slug: string;
  speaker: OgSpeaker;
  talks: string[];
}): Promise<Buffer> {
  const anchor = { x: 925, y: 315, r: 185 };
  const [label, name, tagLine, talk] = await Promise.all([
    eyebrow("Speaker"),
    renderText(speaker.name, {
      weight: 700,
      size: 68,
      minSize: 48,
      lh: 1.05,
      color: C.white,
      maxWidth: COL_WIDTH,
      maxHeight: 150,
    }),
    speaker.tagLine
      ? renderText(speaker.tagLine, {
          size: 26,
          minSize: 20,
          color: C.text,
          maxWidth: COL_WIDTH,
          maxHeight: 92,
        })
      : null,
    talks.length
      ? renderText(talks.map((t) => `“${t}”`).join("\n"), {
          weight: 600,
          size: 32,
          minSize: 22,
          lh: 1.2,
          color: C.blueBright,
          maxWidth: COL_WIDTH,
          maxHeight: 120,
        })
      : null,
  ]);

  const blocks: Block[] = [
    { text: label, gap: 0 },
    { text: name, gap: 14 },
    ...(tagLine ? [{ text: tagLine, gap: 14 }] : []),
    ...(talk ? [{ text: talk, gap: 30 }] : []),
  ];
  const height = blocks.reduce((sum, b) => sum + b.gap + b.text.height, 0);
  // Centre the column in its area when it's short.
  const top = COL_TOP + Math.max(0, (COL_BOTTOM - COL_TOP - height) / 2);

  return compose(
    slug,
    [anchor],
    [
      ...stack(blocks, PAD, top),
      ...(await photoCircle(speaker.photo, speaker.name, anchor)),
    ],
  );
}

export async function sessionCard({
  slug,
  title,
  day,
  speakers,
}: {
  slug: string;
  title: string;
  day?: number;
  speakers: OgSpeaker[];
}): Promise<Buffer> {
  // One large photo, or two overlapping diagonally.
  const anchors: Anchor[] =
    speakers.length > 1
      ? [
          { x: 850, y: 220, r: 135 },
          { x: 1035, y: 425, r: 118 },
        ]
      : speakers.length
        ? [{ x: 925, y: 315, r: 185 }]
        : [];

  const [label, heading, names] = await Promise.all([
    eyebrow(day ? `Session · Day ${day}` : "Session"),
    renderText(title, {
      weight: 700,
      size: 60,
      minSize: 36,
      lh: 1.08,
      color: C.white,
      maxWidth: COL_WIDTH,
      maxHeight: 250,
    }),
    speakers.length
      ? renderText(speakers.map((s) => s.name).join(" & "), {
          weight: 500,
          size: 30,
          minSize: 22,
          color: C.blueBright,
          maxWidth: COL_WIDTH,
          maxHeight: 80,
        })
      : null,
  ]);

  const blocks: Block[] = [
    { text: label, gap: 0 },
    { text: heading, gap: 16 },
    ...(names ? [{ text: names, gap: 28 }] : []),
  ];
  const height = blocks.reduce((sum, b) => sum + b.gap + b.text.height, 0);
  const top = COL_TOP + Math.max(0, (COL_BOTTOM - COL_TOP - height) / 2);

  const photos = await Promise.all(
    speakers
      .slice(0, anchors.length)
      .map((s, i) => photoCircle(s.photo, s.name, anchors[i])),
  );

  return compose(slug, anchors, [...stack(blocks, PAD, top), ...photos.flat()]);
}
