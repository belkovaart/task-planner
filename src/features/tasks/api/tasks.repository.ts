import { db } from "../../../shared/api/supabase";
import type { DbTaskRow, Task } from "../model/task.types";

const fromDb = (row: DbTaskRow): Task => ({
  id: row.id,
  title: row.title,
  url: row.url || "",
  effortHours: Number(row.effort_hours ?? (row.effort ?? 0) * 5),
  start: row.start_date,
  end: row.end_date,
  status: row.status,
  priority: row.priority,
  schedule: {
    mode: row.schedule_mode ?? "auto",
    hoursPerDay: row.daily_hours ?? undefined,
  },
});

const toDb = (task: Task) => ({
  id: task.id,
  title: task.title,
  url: task.url || "",
  effort: Number(task.effortHours) / 5,
  effort_hours: Number(task.effortHours),
  start_date: task.start,
  end_date: task.end,
  status: task.status,
  priority: task.priority,
  schedule_mode: task.schedule.mode,
  daily_hours: task.schedule.mode === "daily" ? Number(task.schedule.hoursPerDay ?? 0) : null,
});

export const tasksRepository = {
  async list() {
    const { data, error } = await db
      .from("tasks")
      .select("*")
      .order("created_at");

    if (error) throw error;
    return (data ?? []).map((row) => fromDb(row as DbTaskRow));
  },

  async create(task: Task) {
    const { error } = await db.from("tasks").insert(toDb(task));
    if (error) throw error;
    return task;
  },

  async update(task: Task) {
    const { error } = await db.from("tasks").update(toDb(task)).eq("id", task.id);
    if (error) throw error;
    return task;
  },

  async remove(id: string) {
    const { error } = await db.from("tasks").delete().eq("id", id);
    if (error) throw error;
  },
};
