export function extractYouTubeVideoId(input: string) {
  const value = input.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    const fromV = url.searchParams.get("v");
    if (fromV) return fromV;
    const path = url.pathname.split("/").filter(Boolean);
    const last = path[path.length - 1];
    if ((url.hostname.includes("youtu.be") || url.pathname.includes("/shorts/")) && last) {
      return last;
    }
  } catch {
    // URL이 아니면 아래 정규식으로 처리
  }

  const match = value.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{6,})/);
  if (match?.[1]) return match[1];

  if (/^[a-zA-Z0-9_-]{6,}$/.test(value)) return value;
  return null;
}

export function youtubeVideoEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
}
