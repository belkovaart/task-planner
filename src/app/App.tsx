import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  addWeeks,
  daysBetween,
  endOfMonth,
  endOfWeek,
  MONTHS_FULL,
  parseISO,
  startOfMonth,
  startOfWeek,
  today as getToday,
} from "../shared/lib/date";
import {
  selectCounts,
  selectOverlappingIds,
  selectPeriodLoad,
  selectStats,
  selectVisibleTasks,
} from "../features/tasks/model/task.selectors";
import { useTasks } from "../features/tasks/model/useTasks";
import TaskForm from "../features/tasks/ui/TaskForm";
import TaskList from "../features/tasks/ui/TaskList";
import Timeline from "../features/tasks/ui/Timeline";
import TweaksPanel, { type Tweaks } from "../features/tasks/ui/TweaksPanel";
import { Icon } from "../features/tasks/ui/Icons";

type TimelineViewMode = "week" | "month";

export default function App() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const today = useMemo(() => getToday(), []);
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useTasks();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [timelineViewMode, setTimelineViewMode] = useState<TimelineViewMode>("week");
  const [periodAnchor, setPeriodAnchor] = useState(today);
  const [tweaks, setTweaks] = useState<Tweaks>({
    accent: "amber",
    density: "comfortable",
  });
  const [tweaksOpen, setTweaksOpen] = useState(false);

  useEffect(() => {
    const accentMap = {
      amber: "#2563eb",
      blue: "#0891b2",
      plum: "#7c3aed",
      moss: "#059669",
    };
    const color = accentMap[tweaks.accent] || accentMap.amber;
    document.documentElement.style.setProperty("--selection", color);
    document.documentElement.style.setProperty("--today", color);
    document.documentElement.style.setProperty(
      "--row-h",
      tweaks.density === "compact" ? "30px" : "36px",
    );
  }, [tweaks]);

  const visibleTasks = useMemo(() => selectVisibleTasks(tasks, filter), [filter, tasks]);
  const counts = useMemo(() => selectCounts(tasks), [tasks]);
  const overlappingIds = useMemo(() => selectOverlappingIds(tasks), [tasks]);
  const stats = useMemo(() => selectStats(tasks, overlappingIds), [overlappingIds, tasks]);
  const editingTask = tasks.find((task) => task.id === editingId) ?? null;
  const visibleRange = useMemo(() => {
    if (timelineViewMode === "week") {
      const start = startOfWeek(periodAnchor);
      return {
        start,
        end: endOfWeek(periodAnchor),
      };
    }

    const monthStart = startOfMonth(periodAnchor);
    const monthEnd = endOfMonth(periodAnchor);

    return {
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    };
  }, [periodAnchor, timelineViewMode]);
  const periodLoad = useMemo(
    () => selectPeriodLoad(visibleTasks, visibleRange.start, visibleRange.end),
    [visibleRange.end, visibleRange.start, visibleTasks],
  );
  const rangeLabel = useMemo(() => {
    if (timelineViewMode === "month") {
      return `${MONTHS_FULL[periodAnchor.getMonth()]} ${periodAnchor.getFullYear()}`;
    }

    const start = visibleRange.start;
    const end = visibleRange.end;
    return `${start.getDate()} ${MONTHS_FULL[start.getMonth()].toLowerCase()} — ${end.getDate()} ${MONTHS_FULL[end.getMonth()].toLowerCase()} ${end.getFullYear()}`;
  }, [periodAnchor, timelineViewMode, visibleRange.end, visibleRange.start]);
  const todayLabel = useMemo(
    () => `${today.getDate()} ${MONTHS_FULL[today.getMonth()].toLowerCase()} ${today.getFullYear()}`,
    [today],
  );

  const withMutationFeedback = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Не удалось выполнить действие";
      window.alert(message);
    }
  };

  const handleDelete = async (id: string) => {
    await withMutationFeedback(async () => {
      await deleteTask(id);
      if (editingId === id) setEditingId(null);
      if (selectedId === id) setSelectedId(null);
    });
  };

  const handleClear = () => setEditingId(null);

  const handleSelectFromList = (id: string) => {
    setSelectedId(id);
    setEditingId(id);
  };

  const handleSelectFromTimeline = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setEditingId(null);
      return;
    }

    setSelectedId(id);
    setEditingId(id);
  };

  const scrollToToday = () => {
    setPeriodAnchor(today);
    if (timelineRef.current) {
      timelineRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const focusConflict = (id: string) => {
    setSelectedId(id);
    setEditingId(id);

    const task = tasks.find((item) => item.id === id);
    if (!task || !timelineRef.current) return;

    setPeriodAnchor(parseISO(task.start));
    timelineRef.current.scrollTo({ left: 0, behavior: "smooth" });
  };

  const shiftPeriod = (direction: -1 | 1) => {
    setPeriodAnchor((current) =>
      timelineViewMode === "week" ? addWeeks(current, direction) : addMonths(current, direction),
    );
  };

  if (loading) {
    return (
      <div className="app-state">
        <div className="spinner" />
        <span>Загружаем задачи…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-state error">
        <span className="app-state-title">Не удалось подключиться к базе</span>
        <span className="app-state-sub">{error}</span>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Планировщик</span>
          <span className="sep">/</span>
          <span className="sub">личные задачи</span>
        </div>
        <div className="topbar-metrics">
          <span className="metric">
            всего <span className="v">{stats.total}</span>
          </span>
          <span className="metric">
            в работе <span className="v">{stats.active}</span>
          </span>
          <span className="metric">
            запланировано <span className="v">{stats.planned}</span>
          </span>
          <span className="metric">
            готово <span className="v">{stats.done}</span>
          </span>
          {stats.conflicts > 0 && (
            <span className="metric warn">
              пересечений <span className="v">{stats.conflicts}</span>
            </span>
          )}
        </div>
        <div className="topbar-right">
          <button className="ghost-btn" onClick={() => setTweaksOpen((prev) => !prev)} title="Настройки">
            <Icon.gear />
          </button>
        </div>
      </header>

      <aside className="form-pane">
        <TaskForm
          editingTask={editingTask}
          today={today}
          onAdd={(task) => withMutationFeedback(() => addTask(task))}
          onSave={(task) => withMutationFeedback(() => updateTask(task))}
          onDelete={handleDelete}
          onClear={handleClear}
        />
      </aside>

      <main className="main-pane">
        <div className="timeline-wrap">
          <div className="timeline-toolbar">
            <div className="tl-title-group">
              <span className="tl-range">{rangeLabel}</span>
              <span className="tl-today-inline">сегодня, {todayLabel}</span>
            </div>
            <div className="tl-controls">
              <div className="pager-group">
                <button className="pager-btn" onClick={() => shiftPeriod(-1)} title="Предыдущий период">
                  <Icon.chevL />
                </button>
                <button className="pager-btn" onClick={() => shiftPeriod(1)} title="Следующий период">
                  <Icon.chevR />
                </button>
              </div>
              <div className="zoom-group">
                <button
                  className={timelineViewMode === "week" ? "active" : ""}
                  onClick={() => setTimelineViewMode("week")}
                >
                  Неделя
                </button>
                <button
                  className={timelineViewMode === "month" ? "active" : ""}
                  onClick={() => setTimelineViewMode("month")}
                >
                  Месяц
                </button>
              </div>
              <button className="today-btn" onClick={scrollToToday}>
                <Icon.target /> К сегодня
              </button>
            </div>
          </div>
          <div className="period-stats">
            <span className={`period-stat ${periodLoad.loadPercent > 100 ? "warn" : ""}`}>
              загрузка <strong>{periodLoad.loadPercent}%</strong>
            </span>
            <span className="period-stat">
              емкость <strong>{periodLoad.capacityHours}ч</strong>
            </span>
            <span className="period-stat">
              запланировано <strong>{periodLoad.allocatedHours}ч</strong>
            </span>
            <span className="period-stat">
              рабочих дней <strong>{periodLoad.workingDays}</strong>
            </span>
            {periodLoad.overloadHours > 0 ? (
              <span className="period-stat warn">
                перегрузка <strong>{periodLoad.overloadHours}ч</strong>
              </span>
            ) : (
              <span className="period-stat">
                запас <strong>{periodLoad.freeHours}ч</strong>
              </span>
            )}
          </div>

          <Timeline
            tasks={visibleTasks}
            selectedId={selectedId}
            onSelect={handleSelectFromTimeline}
            onDelete={handleDelete}
            rangeStart={visibleRange.start}
            rangeEnd={visibleRange.end}
            today={today}
            timelineRef={timelineRef}
          />
        </div>

        <div className="list-wrap">
          <TaskList
            tasks={visibleTasks}
            selectedId={selectedId}
            overlappingIds={overlappingIds}
            filter={filter}
            counts={counts}
            onSelect={handleSelectFromList}
            onDelete={handleDelete}
            onFocusConflict={focusConflict}
            setFilter={setFilter}
          />
        </div>
      </main>

      <TweaksPanel open={tweaksOpen} tweaks={tweaks} setTweaks={setTweaks} />
    </div>
  );
}
