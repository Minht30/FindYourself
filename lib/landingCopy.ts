// What the landing page says. Kept apart from the markup so the words can be checked: each
// claim here is one the app can back up (the README, the privacy page and the code say the
// same), and the app's copy rules hold (sentence case, no "please", no "successfully").

export const GITHUB_URL = "https://github.com/Minht30/FindYourself";

export const HERO = {
  badge: "A calm place for your day",
  title: "Plan your day.",
  accent: "Find yourself.",
  sub: "A single, calm place for your timetable, your diary, your focus sessions, and the sound of rain on the window.",
  smallPrint: "The demo is a temporary account with sample data. No sign-up needed.",
  scroll: "See a day in FindYourself",
} as const;

export type Feature = { key: "timetable" | "diary" | "focus"; title: string; text: string; alt: string };

export const FEATURES_TITLE = "Everything for your day, in one calm place";

export const FEATURES: readonly Feature[] = [
  {
    key: "timetable",
    title: "Draw your week",
    text: "Drag on the grid to make a block, move it, stretch it, colour it by category. Copy yesterday when today looks the same.",
    alt: "The timetable: a week grid with coloured blocks, and a side column with today's progress, a streak and your tasks.",
  },
  {
    key: "diary",
    title: "Write it down",
    text: "One page for each day, with a mood and a few gentle prompts. It saves as you type, and a map of the year shows the days you wrote.",
    alt: "The diary: a page for one day with a mood picked and a few written lines, and a year map below.",
  },
  {
    key: "focus",
    title: "Stay with one thing",
    text: "A timer that keeps running while you move around the app. A little spirit rides the ring, and a flower blooms for every session you finish.",
    alt: "The focus page: timer settings, the round timer with its spirit, and this week's focus time with recent sessions.",
  },
];

export type SmallItem = { key: "tasks" | "chill" | "streak"; title: string; text: string };

export const SMALL_ITEMS: readonly SmallItem[] = [
  { key: "tasks", title: "Tasks, with Focus first", text: "Today, Tomorrow and Backlog. Mark one task Focus first and it stays in the header, with its countdown, until it is done." },
  { key: "chill", title: "Chill", text: "Rain, fire, keyboard, cafe chatter and piano, mixed by you, or your own music. Open the scene full screen and leave it running." },
  { key: "streak", title: "A streak without the guilt", text: "One diary line or one finished task keeps it going. Miss a day and it says welcome back, nothing more." },
];

export const THEMES = {
  title: "A scene that follows your day",
  text: "Day brings Monstadt and night brings Nod-Krai. Auto follows your clock: night runs from 18:00 to 06:00 in your time zone. Prefer one? Pick it by hand, any time.",
  switch: ["Day", "Night", "Auto"],
} as const;

export const CARE_TITLE = "Careful where it counts";

export const CARE: readonly { key: "private" | "accessible" | "calm"; title: string; text: string }[] = [
  {
    key: "private",
    title: "Private by default",
    text: "The database itself locks every row to its owner, not only the app. The privacy page lists every cookie and what it is for, in plain words.",
  },
  {
    key: "accessible",
    title: "Accessible",
    text: "Text colours are tested against WCAG AA on every surface, and every animation stops when your device asks for less motion.",
  },
  {
    key: "calm",
    title: "Calm on purpose",
    text: "No ads, no analytics, no tracking, and no AI features. Notifications stay off unless you turn them on.",
  },
];

export const CLOSING = { title: "Ready when you are.", text: "Open the timetable, or look around with a demo that comes with sample data." } as const;

export const FOOTER = { made: "FindYourself, made by Minh", privacy: "Privacy", source: "Source on GitHub" } as const;

// Every sentence on the page, for the checks below.
export function allCopy(): string[] {
  return [
    ...Object.values(HERO),
    FEATURES_TITLE,
    ...FEATURES.flatMap((f) => [f.title, f.text, f.alt]),
    ...SMALL_ITEMS.flatMap((i) => [i.title, i.text]),
    THEMES.title,
    THEMES.text,
    CARE_TITLE,
    ...CARE.flatMap((c) => [c.title, c.text]),
    CLOSING.title,
    CLOSING.text,
    ...Object.values(FOOTER),
  ];
}
