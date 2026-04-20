import { fmtISO, isWeekend } from "./date";

export const WORK_HOURS_PER_DAY = 5;

const ARMENIA_FIXED_HOLIDAYS: Array<{ month: number; day: number; label: string }> = [
  { month: 0, day: 1, label: "Новый год" },
  { month: 0, day: 2, label: "Новогодние праздники" },
  { month: 0, day: 6, label: "Рождество" },
  { month: 0, day: 28, label: "День армии" },
  { month: 2, day: 8, label: "Международный женский день" },
  { month: 3, day: 24, label: "День памяти жертв Геноцида армян" },
  { month: 4, day: 1, label: "День труда" },
  { month: 4, day: 9, label: "День Победы и мира" },
  { month: 6, day: 5, label: "День Конституции" },
  { month: 8, day: 21, label: "День независимости" },
  { month: 11, day: 31, label: "Канун Нового года" },
];

export const getArmeniaHolidayLabel = (date: Date) => {
  const match = ARMENIA_FIXED_HOLIDAYS.find(
    (holiday) => holiday.month === date.getMonth() && holiday.day === date.getDate(),
  );

  return match?.label ?? null;
};

export const isArmeniaHoliday = (date: Date) => Boolean(getArmeniaHolidayLabel(date));

export const isNonWorkingDay = (date: Date) => isWeekend(date) || isArmeniaHoliday(date);

export const getWorkingDatesInRange = (start: Date, end: Date) => {
  const cursor = new Date(start);
  const dates: string[] = [];

  while (cursor <= end) {
    if (!isNonWorkingDay(cursor)) dates.push(fmtISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

export const countWorkingDaysInRange = (start: Date, end: Date) =>
  getWorkingDatesInRange(start, end).length;

export const isWorkingIsoDate = (iso: string) => getWorkingDatesInRange(new Date(iso), new Date(iso)).length > 0;
