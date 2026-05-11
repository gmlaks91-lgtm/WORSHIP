/** 한국 날짜 기준 `YYYY-MM-DD` (콘티 event_date 비교용). */
export function todayYmdKst(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}
