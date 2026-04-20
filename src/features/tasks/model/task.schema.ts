import { daysBetween, parseISO } from "../../../shared/lib/date";
import type { Task } from "./task.types";

export interface TaskDraft {
  title: string;
  url: string;
  effortHours: number | string;
  start: string;
  end: string;
  status: Task["status"];
  priority: Task["priority"];
  schedule: Task["schedule"];
}

export type TaskErrors = Partial<Record<keyof TaskDraft, string>>;

export const validateTaskDraft = (draft: TaskDraft) => {
  const errors: TaskErrors = {};

  if (!draft.title.trim()) errors.title = "Введите название задачи";
  if (parseISO(draft.end) < parseISO(draft.start)) {
    errors.end = "Окончание раньше начала";
  }
  if (Number(draft.effortHours) <= 0 || !Number.isFinite(Number(draft.effortHours))) {
    errors.effortHours = "Неверная оценка";
  }
  if (draft.url && !/^(https?:\/\/|mailto:|\/)/i.test(draft.url.trim())) {
    errors.url = "Ссылка должна начинаться с http(s)://";
  }
  if (draft.schedule.mode === "daily") {
    const hoursPerDay = Number(draft.schedule.hoursPerDay);
    if (hoursPerDay <= 0 || !Number.isFinite(hoursPerDay)) {
      errors.schedule = "Укажите корректное число часов в день";
    }
  }
  if (draft.schedule.mode === "selected_days") {
    if (!draft.schedule.selectedDates || draft.schedule.selectedDates.length === 0) {
      errors.schedule = "Выберите хотя бы один день";
    }
  }

  return errors;
};

export const draftDurationDays = (draft: TaskDraft) =>
  Math.max(1, daysBetween(parseISO(draft.start), parseISO(draft.end)) + 1);
