import { daysBetween, fmtDateShort, parseISO, pluralRu } from "../../../shared/lib/date";
import { PRIORITY, STATUS, type Task } from "../model/task.types";
import { Icon } from "./Icons";

interface TaskListProps {
  tasks: Task[];
  selectedId: string | null;
  overlappingIds: Set<string>;
  filter: string;
  counts: Record<string, number>;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onFocusConflict: (id: string) => void;
  setFilter: (filter: string) => void;
}

export default function TaskList({
  tasks,
  selectedId,
  overlappingIds,
  filter,
  counts,
  onSelect,
  onDelete,
  onFocusConflict,
  setFilter,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">
          <Icon.cal />
        </div>
        <div className="empty-title">Задач не найдено</div>
        <div className="empty-sub">
          Добавьте первую задачу в форме слева — она появится на таймлайне и в этом списке.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="list-toolbar">
        <div className="list-toolbar-left">
          <span className="list-label">Задачи</span>
          <div className="list-filters">
            {[
              ["all", "Все"],
              ["progress", "В работе"],
              ["planned", "Запланировано"],
              ["done", "Готово"],
              ["paused", "На паузе"],
            ].map(([key, label]) => (
              <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
                {label}
                <span className="count">{counts[key] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <span className="list-hint">
          {tasks.length} {pluralRu(tasks.length, ["задача", "задачи", "задач"])} · кликните строку
          для выбора
        </span>
      </div>

      <div className="list-scroll">
        <table className="list-table">
          <thead>
            <tr>
              <th style={{ width: "38%" }}>Задача</th>
              <th style={{ width: "16%" }}>Даты</th>
              <th style={{ width: "10%" }} className="num">
                Длит.
              </th>
              <th style={{ width: "10%" }} className="num">
                Часы
              </th>
              <th style={{ width: "14%" }}>Статус</th>
              <th style={{ width: "12%" }}>Приоритет</th>
              <th style={{ width: "36px" }} />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const start = parseISO(task.start);
              const end = parseISO(task.end);
              const duration = daysBetween(start, end) + 1;
              const isSelected = task.id === selectedId;
              const dim = selectedId && !isSelected;
              const hasOverlap = overlappingIds.has(task.id);

              return (
                <tr
                  key={task.id}
                  className={`${isSelected ? "selected" : ""} ${dim ? "dim" : ""}`}
                  onClick={() => onSelect(task.id)}
                >
                  <td className="name">
                    {task.title}
                    {task.url && (
                      <span className="link-ico">
                        <Icon.link />
                      </span>
                    )}
                    {hasOverlap && task.status !== "done" && (
                      <span
                        className="conflict-pill"
                        title="Открыть конфликт на таймлайне"
                        onClick={(event) => {
                          event.stopPropagation();
                          onFocusConflict(task.id);
                        }}
                      >
                        пересечение <Icon.chevR />
                      </span>
                    )}
                  </td>
                  <td className="dates mono">
                    {fmtDateShort(start)} → {fmtDateShort(end)}
                  </td>
                  <td className="meta mono num">{duration}</td>
                  <td className="meta mono num">{task.effortHours}</td>
                  <td>
                    <span className={`badge status-${task.status}`}>
                      <span className="dot" />
                      {STATUS[task.status].label}
                    </span>
                  </td>
                  <td>
                    <span className={`prio ${task.priority}`}>
                      <span className="bars">
                        <span />
                        <span />
                        <span />
                      </span>
                      {PRIORITY[task.priority].label}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="row-delete"
                      title="Удалить задачу"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Удалить задачу «${task.title}»?`)) {
                          void onDelete(task.id);
                        }
                      }}
                    >
                      <Icon.trash />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
