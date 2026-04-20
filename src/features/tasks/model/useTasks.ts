import { useEffect, useState } from "react";
import { tasksRepository } from "../api/tasks.repository";
import type { Task } from "./task.types";

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    tasksRepository
      .list()
      .then((data) => {
        if (!alive) return;
        setTasks(data);
      })
      .catch((err: { message?: string }) => {
        if (!alive) return;
        setError(err.message ?? "Не удалось загрузить задачи");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const addTask = async (task: Task) => {
    await tasksRepository.create(task);
    setTasks((prev) => [...prev, task]);
  };

  const updateTask = async (task: Task) => {
    await tasksRepository.update(task);
    setTasks((prev) => prev.map((item) => (item.id === task.id ? task : item)));
  };

  const deleteTask = async (id: string) => {
    await tasksRepository.remove(id);
    setTasks((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
  };
};
