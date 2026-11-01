import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro";
import { getSpeakers } from "../../../helpers/data/getSpeakers";
import { speakerCard } from "../../../helpers/og/ogCard";

export const getStaticPaths = (async () => {
  const speakers = await getSpeakers();
  return speakers.map((speaker) => ({
    params: { speaker: speaker.slug },
    props: { speaker },
  }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props: { speaker } }) => {
  const jpg = await speakerCard({
    slug: speaker.slug || "",
    speaker: {
      name: speaker.fullName || "",
      tagLine: speaker.tagLine,
      photo: speaker.profilePicture,
    },
    talks: (speaker.sessions || []).map((talk) => talk.name),
  });
  return new Response(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg" },
  });
};
