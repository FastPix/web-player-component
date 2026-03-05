export type ShortMeta = {
  id: string;
  creator: string;
  title: string;
  likes: string;
  comments: string;
  shares: string;
};

export interface FastPixPlayerElement extends HTMLElement {
  video?: HTMLVideoElement;
  play?: () => Promise<void> | void;
  pause?: () => void;
  mute?: () => void;
  unmute?: () => void;
  destroy?: () => void;
}

// Demo feed – replace with real API data in your app.
export const SHORTS_FEED: ShortMeta[] = [
  {
    id: "e089311f-e6a5-48fa-ac92-3bbe3fec31eb",
    creator: "telugubeats",
    title: "Ragili Chedipotnunna 🎵",
    likes: "12.4K",
    comments: "342",
    shares: "891",
  },
  {
    id: "31344b13-c43e-4992-aef1-0cb54f8a9f2b",
    creator: "tollywood_edits",
    title: "Mahaan Beats 🔥 | Best Telugu BGM",
    likes: "8.7K",
    comments: "201",
    shares: "543",
  },
  {
    id: "55f36f6a-91fe-439e-8993-04619136299d",
    creator: "prima_music",
    title: "Telugu Prima 🎶 | Feel the vibe",
    likes: "21K",
    comments: "987",
    shares: "2.1K",
  },
  {
    id: "c655164e-2f08-47d5-a3eb-4e3bf2d444df",
    creator: "helu_tunes",
    title: "Helu Vibes 💫 | Trending Now",
    likes: "5.3K",
    comments: "118",
    shares: "310",
  },
];

