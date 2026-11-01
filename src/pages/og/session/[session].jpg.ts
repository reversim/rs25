import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro";
import slug from "slug";
import { getSessions } from "../../../helpers/data/getSessions";
import { getSpeakers } from "../../../helpers/data/getSpeakers";
import { sessionCard } from "../../../helpers/og/ogCard";

export const getStaticPaths = (async () => {
  const [{ rawSessionsList }, speakers] = await Promise.all([
    getSessions(),
    getSpeakers(),
  ]);
  const speakersById = new Map(speakers.map((s) => [String(s.id), s]));

  return rawSessionsList.map((session) => ({
    params: { session: slug(session.title) },
    props: {
      title: session.title,
      day: session.day,
      speakers: session.speakers.map((s) => {
        const speaker = speakersById.get(String(s.id));
        return {
          name: speaker?.fullName || s.name || "",
          photo: speaker?.profilePicture,
        };
      }),
    },
  }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props, params }) => {
  const jpg = await sessionCard({ slug: params.session || "", ...props });
  return new Response(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg" },
  });
};
