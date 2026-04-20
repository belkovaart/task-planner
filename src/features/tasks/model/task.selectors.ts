import {
  addDays,
  daysBetween,
  fmtDateShort,
  MONTHS_FULL,
  MONTHS_RU,
  parseISO,
  startOfDay,
} from "../../../shared/lib/date";
import {
  countWorkingDaysInRange,
  getWorkingDatesInRange,
  isArmeniaHoliday,
  isNonWorkingDay,
  WORK_HOURS_PER_DAY,
} from "../../../shared/lib/calendar";
import type { Task } from "./task.types";

export const getTaskPlannedHoursByWorkingDate = (task: Task) => {
  const workingDates = getWorkingDatesInRange(parseISO(task.start), parseISO(task.end));
  if (workingDates.length === 0) return new Map<string, number>();

  const allocation = new Map<string, number>();

  if (task.schedule.mode === "daily") {
    let remaining = task.effortHours;
    const dailyLimit = Math.max(Number(task.schedule.hoursPerDay ?? 0), 0);

    for (const date of workingDates) {
      if (remaining <= 0) break;
      const planned = Math.min(dailyLimit, remaining);
      allocation.set(date, planned);
      remaining -= planned;
    }

    return allocation;
  }

  if (task.schedule.mode === "selected_days") {
    const selectedDates = (task.schedule.selectedDates ?? []).filter((date) =>
      workingDates.includes(date),
    );
    if (selectedDates.length === 0) return allocation;

    const perDay = task.effortHours / selectedDates.length;
    selectedDates.forEach((date) => allocation.set(date, perDay));
    return allocation;
  }

  const perDay = task.effortHours / workingDates.length;
  workingDates.forEach((date) => allocation.set(date, perDay));
  return allocation;
};

export const selectVisibleTasks = (tasks: Task[], filter: string) => {
  if (filter === "all") return tasks;
  return tasks.filter((task) => task.status === filter);
};

export const selectCounts = (tasks: Task[]) => {
  const counts = { all: tasks.length, planned: 0, progress: 0, done: 0, paused: 0 };
  tasks.forEach((task) => {
    counts[task.status] += 1;
  });
  return counts;
};

export const selectOverlappingIds = (tasks: Task[]) => {
  const ids = new Set<string>();
  const active = tasks.filter((task) => task.status !== "done");
  const dates = new Set<string>();

  active.forEach((task) => {
    getTaskPlannedHoursByWorkingDate(task).forEach((_, date) => dates.add(date));
  });

  dates.forEach((date) => {
    const tasksForDay = active.filter((task) => getTaskPlannedHoursByWorkingDate(task).has(date));
    if (tasksForDay.length < 2) return;

    const totalHours = tasksForDay.reduce((sum, task) => {
      return sum + (getTaskPlannedHoursByWorkingDate(task).get(date) ?? 0);
    }, 0);

    if (totalHours > WORK_HOURS_PER_DAY) {
      tasksForDay.forEach((task) => ids.add(task.id));
    }
  });

  return ids;
};

export const selectStats = (tasks: Task[], overlappingIds: Set<string>) => ({
  active: tasks.filter((task) => task.status === "progress").length,
  planned: tasks.filter((task) => task.status === "planned").length,
  done: tasks.filter((task) => task.status === "done").length,
  conflicts: overlappingIds.size,
  total: tasks.length,
});

export const selectRange = (tasks: Task[], today: Date) => {
  const dates = tasks.flatMap((task) => [parseISO(task.start), parseISO(task.end)]);
  dates.push(today);

  const min = new Date(Math.min(...dates.map((date) => date.getTime())));
  const max = new Date(Math.max(...dates.map((date) => date.getTime())));

  return {
    start: addDays(startOfDay(min), -3),
    end: addDays(startOfDay(max), 5),
  };
};

export const computeWorkload = (tasks: Task[], range: Date[]) =>
  range.map((day) => {
    if (isNonWorkingDay(day)) return 0;
    const iso = day.toISOString().slice(0, 10);

    return tasks.reduce((sum, task) => {
      if (task.status === "done") return sum;
      const allocation = getTaskPlannedHoursByWorkingDate(task);
      return sum + (allocation.get(iso) ?? 0);
    }, 0);
  });

export const computeOverlapBands = (tasks: Task[], rangeStart: Date, rangeEnd: Date) => {
  const bands: Array<{ start: number; end: number; type: "soft" | "hard" }> = [];
  let current: { start: number; end: number; type: "soft" | "hard" } | null = null;
  const total = daysBetween(rangeStart, rangeEnd) + 1;
  const active = tasks.filter((task) => task.status !== "done");

  for (let i = 0; i < total; i += 1) {
    const day = addDays(rangeStart, i);
    const iso = day.toISOString().slice(0, 10);
    const tasksForDay = active.filter((task) => getTaskPlannedHoursByWorkingDate(task).has(iso));
    const overlapping = tasksForDay.length >= 2;

    if (overlapping) {
      const totalHours = tasksForDay.reduce((sum, task) => {
        return sum + (getTaskPlannedHoursByWorkingDate(task).get(iso) ?? 0);
      }, 0);
      const type: "soft" | "hard" = totalHours > WORK_HOURS_PER_DAY ? "hard" : "soft";

      if (!current) current = { start: i, end: i, type };
      else if (current.type === type && current.end === i - 1) current.end = i;
      else {
        bands.push(current);
        current = { start: i, end: i, type };
      }
    } else if (current) {
      bands.push(current); current = null;
    }
  }

  if (current) bands.push(current);
  return bands;
};

export const computeTimelineLayout = (tasks: Task[]) => {
  const sorted = [...tasks].sort(
    (a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime(),
  );
  const tracks: Array<Array<{ s: Date; e: Date }>> = [];
  const laidOut: Array<Task & { lane: number }> = [];

  sorted.forEach((task) => {
    const start = parseISO(task.start);
    const end = parseISO(task.end);
    let lane = -1;

    for (let i = 0; i < tracks.length; i += 1) {
      if (tracks[i].every((range) => end < range.s || start > range.e)) {
        lane = i;
        break;
      }
    }

    if (lane === -1) {
      lane = tracks.length;
      tracks.push([]);
    }

    tracks[lane].push({ s: start, e: end });
    laidOut.push({ ...task, lane });
  });

  return { tasks: laidOut, lanes: Math.max(3, tracks.length) };
};

export const selectPeriodLoad = (tasks: Task[], rangeStart: Date, rangeEnd: Date) => {
  const workingDays = countWorkingDaysInRange(rangeStart, rangeEnd);
  const capacityHours = workingDays * WORK_HOURS_PER_DAY;
  const visibleWorkingDates = new Set(getWorkingDatesInRange(rangeStart, rangeEnd));

  const allocatedHours = tasks.reduce((sum, task) => {
    if (task.status === "done") return sum;

    const allocation = getTaskPlannedHoursByWorkingDate(task);
    let taskHoursInPeriod = 0;
    allocation.forEach((hours, date) => {
      if (visibleWorkingDates.has(date)) taskHoursInPeriod += hours;
    });

    return sum + taskHoursInPeriod;
  }, 0);

  return {
    workingDays,
    capacityHours,
    allocatedHours: Math.round(allocatedHours * 10) / 10,
    freeHours: Math.round(Math.max(capacityHours - allocatedHours, 0) * 10) / 10,
    overloadHours: Math.round(Math.max(allocatedHours - capacityHours, 0) * 10) / 10,
    loadPercent: capacityHours > 0 ? Math.round((allocatedHours / capacityHours) * 100) : 0,
  };
};

export const isHolidayCell = (date: Date) => isArmeniaHoliday(date);

export const formatRangeLabel = (start: Date, end: Date) => {
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${MONTHS_FULL[start.getMonth()].toLowerCase()} ${start.getFullYear()}`;
  }

  return `${start.getDate()} ${MONTHS_RU[start.getMonth()].toLowerCase()} — ${end.getDate()} ${MONTHS_RU[end.getMonth()].toLowerCase()} ${end.getFullYear()}`;
};

export const formatTodayLabel = (today: Date) =>
  `${today.getDate()} ${MONTHS_FULL[today.getMonth()].toLowerCase()} ${today.getFullYear()}`;

export const makeConflictScrollTitle = (task: Task) =>
  `${task.title} · ${fmtDateShort(parseISO(task.start))} → ${fmtDateShort(parseISO(task.end))}`;
