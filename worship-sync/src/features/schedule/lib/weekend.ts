import { addDays, format, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";

/**
 * 이번 주말 토·일(토=연습, 일=예배) 날짜를 반환합니다.
 * - 월~토: 다가오는(또는 오늘인) 토요일 + 그 다음 날 일요일
 * - 일요일: 어제 토요일(연습) + 오늘(예배) — 당일 예배 응답을 놓치지 않도록 함
 */
export function getUpcomingWeekendPair(from: Date = new Date()) {
  const today = startOfDay(from);
  const dow = today.getDay();

  let saturday: Date;
  let sunday: Date;

  if (dow === 0) {
    saturday = addDays(today, -1);
    sunday = today;
  } else {
    const daysUntilSaturday = (6 - dow + 7) % 7;
    saturday = addDays(today, daysUntilSaturday);
    sunday = addDays(saturday, 1);
  }

  return {
    practiceDate: format(saturday, "yyyy-MM-dd"),
    worshipDate: format(sunday, "yyyy-MM-dd"),
    saturday,
    sunday,
    practiceLabel: format(saturday, "M월 d일 (EEE)", { locale: ko }),
    worshipLabel: format(sunday, "M월 d일 (EEE)", { locale: ko }),
  };
}
