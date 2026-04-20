export type TaskStatus = "planned" | "progress" | "done" | "paused";
export type TaskPriority = "low" | "med" | "high";
export type TaskScheduleMode = "auto" | "daily" | "selected_days";

export interface TaskSchedule {
  mode: TaskScheduleMode;
  hoursPerDay?: number;
  selectedDates?: string[];
}

export interface Task {
  id: string;
  title: string;
  url: string;
  effortHours: number;
  start: string;
  end: string;
  status: TaskStatus;
  priority: TaskPriority;
  schedule: TaskSchedule;
}

export interface DbTaskRow {
  id: string;
  title: string;
  url: string | null;
  effort?: number | null;
  effort_hours?: number | null;
  start_date: string;
  end_date: string;
  status: TaskStatus;
  priority: TaskPriority;
  schedule_mode?: TaskScheduleMode | null;
  daily_hours?: number | null;
  selected_dates?: string[] | null;
}

export const STATUS = {
  planned: { key: "planned", label: "Запланировано", short: "Запланировано" },
  progress: { key: "progress", label: "В работе", short: "В работе" },
  done: { key: "done", label: "Готово", short: "Готово" },
  paused: { key: "paused", label: "На паузе", short: "На паузе" },
} as const;

export const STATUS_ORDER: TaskStatus[] = ["planned", "progress", "done", "paused"];

export const PRIORITY = {
  low: { key: "low", label: "Низкий" },
  med: { key: "med", label: "Средний" },
  high: { key: "high", label: "Высокий" },
} as const;

export const PRIORITY_ORDER: TaskPriority[] = ["low", "med", "high"];
