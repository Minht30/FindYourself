export type Track = {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  sizeBytes: number;
  createdAt: string;
};

export type TrackRow = {
  id: string;
  title: string;
  artist: string;
  duration_seconds: number;
  size_bytes: number;
  created_at: string;
};

export const TRACK_COLUMNS = "id, title, artist, duration_seconds, size_bytes, created_at";

export const toTrack = (r: TrackRow): Track => ({
  id: r.id,
  title: r.title,
  artist: r.artist,
  durationSeconds: r.duration_seconds,
  sizeBytes: Number(r.size_bytes),
  createdAt: r.created_at,
});

// "3:07", "62:05"
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(Number.isFinite(seconds) ? seconds : 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
