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

export interface talks {
  groupId: number;
  groupName: string;
  sessions: talk[];
}

export async function getTalks() {
  const result = await fetch(
    "https://sessionize.com/api/v2/qjyi27ms/view/Sessions"
  );

  const rawTalksList: talk[] = [];

  const data: talks[] = await result.json();
  data.map((session: talks) => {
    session.sessions.map((talk) => {
      rawTalksList.push(talk);
    });
  });
  return { rawData: data, rawTalksList };
}
