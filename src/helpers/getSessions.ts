export interface talkSpeaker {
  id: string;
  name: string;
}
export interface categoryItem {
  id: string;
  name: string;
}
export interface category {
  id: number;
  name: string;
  categoryItems: categoryItem[];
  sort: number;
}

export interface talk {
  questionAnswers: [];
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  isServiceSession: boolean;
  isPlenumSession: boolean;
  speakers: talkSpeaker[];
  categories: category[];
  roomId: number;
  room: string;
  liveUrl: any;
  recordingUrl: any;
  status: any;
  isInformed: boolean;
  isConfirmed: boolean;
}

export interface session {
  groupId: number;
  groupName: string;
  sessions: talk[];
}

export async function getSessions() {
  const result = await fetch(
    "https://sessionize.com/api/v2/fan6lxrk/view/Sessions",
  );

  const rawSessionsList: talk[] = [];

  const data: session[] = await result.json();
  data.map((session: session) => {
    session.sessions.map((session) => {
      rawSessionsList.push(session);
    });
  });
  return { rawData: data, rawSessionsList };
}
