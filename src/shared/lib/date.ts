export const fmtISO = (dt: Date) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");

  return `${y}-${m}-${dd}`;
};

export const parseISO = (s: string) => {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd);
};

export const daysBetween = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / 86400000);

export const addDays = (dt: Date, n: number) => {
  const result = new Date(dt);
  result.setDate(result.getDate() + n);
  return result;
};

export const addWeeks = (dt: Date, n: number) => addDays(dt, n * 7);

export const addMonths = (dt: Date, n: number) => {
  const result = new Date(dt);
  result.setMonth(result.getMonth() + n);
  return result;
};

export const startOfDay = (dt: Date) =>
  new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());

export const startOfWeek = (dt: Date) => {
  const current = startOfDay(dt);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(current, diff);
};

export const endOfWeek = (dt: Date) => addDays(startOfWeek(dt), 6);

export const startOfMonth = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), 1);

export const endOfMonth = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth() + 1, 0);

export const today = () => startOfDay(new Date());

export const isWeekend = (dt: Date) => {
  const day = dt.getDay();
  return day === 0 || day === 6;
};

export const fmtDateShort = (dt: Date) =>
  `${String(dt.getDate()).padStart(2, "0")}.${String(dt.getMonth() + 1).padStart(2, "0")}`;

export const pluralRu = (n: number, forms: [string, string, string]) => {
  const m10 = n % 10;
  const m100 = n % 100;

  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
  return forms[2];
};

export const MONTHS_RU = [
  "Янв",
  "Фев",
  "Мар",
  "Апр",
  "Май",
  "Июн",
  "Июл",
  "Авг",
  "Сен",
  "Окт",
  "Ноя",
  "Дек",
];

export const MONTHS_FULL = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export const DOW_RU = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
