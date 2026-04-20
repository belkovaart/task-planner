import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
  type RefObject,
} from "react";
import {
  daysBetween,
  DOW_RU,
  fmtDateShort,
  MONTHS_FULL,
  parseISO,
  pluralRu,
} from "../../../shared/lib/date";
import { getArmeniaHolidayLabel, isNonWorkingDay } from "../../../shared/lib/calendar";
import {
  computeOverlapBands,
  computeTimelineLayout,
  computeWorkload,
  getTaskPlannedHoursByWorkingDate,
} from "../model/task.selectors";
import { STATUS, type Task } from "../model/task.types";
import { Icon } from "./Icons";

interface TimelineProps {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEmptyClick: () => void;
  onDelete: (id: string) => Promise<void>;
  rangeStart: Date;
  rangeEnd: Date;
  today: Date;
  timelineRef: RefObject<HTMLDivElement>;
}

export default function Timeline({
  tasks,
  selectedId,
  onSelect,
  onEmptyClick,
  onDelete,
  rangeStart,
  rangeEnd,
  today,
  timelineRef,
}: TimelineProps) {
  const [viewportWidth, setViewportWidth] = useState(0);

  const days = useMemo(() => {
    const total = daysBetween(rangeStart, rangeEnd) + 1;
    return Array.from({ length: total }, (_, index) => {
      const date = new Date(rangeStart);
      date.setDate(rangeStart.getDate() + index);
      return date;
    });
  }, [rangeEnd, rangeStart]);

  const tasksInRange = useMemo(
    () =>
      tasks.filter((task) => {
        const start = parseISO(task.start);
        const end = parseISO(task.end);
        return start <= rangeEnd && end >= rangeStart;
      }),
    [rangeEnd, rangeStart, tasks],
  );

  const months = useMemo(() => {
    const result: Array<{ key: number; label: string; count: number }> = [];
    let current: { key: number; label: string; count: number } | null = null;

    days.forEach((date) => {
      const key = date.getFullYear() * 12 + date.getMonth();

      if (!current || current.key !== key) {
        current = {
          key,
          label: `${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`,
          count: 1,
        };
        result.push(current);
        return;
      }

      current.count += 1;
    });

    return result;
  }, [days]);

  const dayWidth = viewportWidth > 0 ? viewportWidth / Math.max(days.length, 1) : 38;
  const totalWidth = Math.max(viewportWidth, days.length * dayWidth);
  const workload = useMemo(() => computeWorkload(tasksInRange, days), [days, tasksInRange]);
  const overlapBands = useMemo(
    () => computeOverlapBands(tasksInRange, rangeStart, rangeEnd),
    [rangeEnd, rangeStart, tasksInRange],
  );
  const laid = useMemo(() => computeTimelineLayout(tasksInRange), [tasksInRange]);

  useEffect(() => {
    if (!timelineRef.current) return;

    const element = timelineRef.current;
    const updateViewportWidth = () => setViewportWidth(element.clientWidth);

    updateViewportWidth();

    const observer = new ResizeObserver(() => updateViewportWidth());
    observer.observe(element);

    return () => observer.disconnect();
  }, [timelineRef]);

  const todayLeft = daysBetween(rangeStart, today) * dayWidth + dayWidth / 2;
  const rowHeight = 36;
  const showToday = today >= rangeStart && today <= rangeEnd;
  const handleBodyClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      target.closest(".tl-bar") ||
      target.closest(".tl-bar-group") ||
      target.closest(".tl-overlap-band")
    ) {
      return;
    }

    onEmptyClick();
  };

  return (
    <div className="tl-scroll" ref={timelineRef}>
      <div className="tl-grid" style={{ width: totalWidth }}>
        <div className="tl-header">
          <div className="tl-months">
            {months.map((month) => (
              <div key={month.key} className="tl-month" style={{ width: month.count * dayWidth }}>
                {month.label}
              </div>
            ))}
          </div>

          <div className="tl-days">
            {days.map((date, index) => {
              const isToday = date.getTime() === today.getTime();
              const holidayLabel = getArmeniaHolidayLabel(date);

              return (
                <div
                  key={index}
                  className={`tl-day ${isNonWorkingDay(date) ? "weekend" : ""} ${holidayLabel ? "holiday" : ""} ${isToday ? "today" : ""}`}
                  style={{ width: dayWidth }}
                  title={holidayLabel ?? undefined}
                >
                  <span className="dow">{DOW_RU[date.getDay()]}</span>
                  <span className="num">{date.getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tl-workload-wrap">
          <span className="tl-workload-label">Загрузка</span>
          <div className="tl-workload">
            {days.map((date, index) => {
              const load = workload[index];
              const holidayLabel = getArmeniaHolidayLabel(date);
              const capped = Math.min(5, load);
              const height = load === 0 ? 0 : 3 + capped * 4;

              return (
                <div
                  key={index}
                  className={`tl-wl-cell ${isNonWorkingDay(date) ? "weekend" : ""} ${holidayLabel ? "holiday" : ""}`}
                  data-load={capped}
                  style={{ width: dayWidth }}
                  title={
                    holidayLabel
                      ? `${fmtDateShort(date)} · ${holidayLabel}`
                      : `${fmtDateShort(date)} · ${Math.round(load * 10) / 10} ${pluralRu(Math.round(load), ["час", "часа", "часов"])}`
                  }
                >
                  {load > 0 && <div className="tl-wl-bar" style={{ height }} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="tl-body" style={{ height: laid.lanes * rowHeight + 8 }} onClick={handleBodyClick}>
          {Array.from({ length: laid.lanes }).map((_, laneIdx) => (
            <div className="tl-row" key={laneIdx} style={{ height: rowHeight }}>
              {days.map((date, index) => (
                <div
                  key={index}
                  className={`tl-row-cell ${isNonWorkingDay(date) ? "weekend" : ""} ${getArmeniaHolidayLabel(date) ? "holiday" : ""}`}
                  style={{ width: dayWidth }}
                />
              ))}
            </div>
          ))}

          {overlapBands.map((band, index) => (
            <div
              key={`band-${index}`}
              className={`tl-overlap-band ${band.type}`}
              style={{
                left: band.start * dayWidth,
                width: (band.end - band.start + 1) * dayWidth,
              }}
              title={
                band.type === "hard"
                  ? "Перегрузка: задач больше, чем помещается в рабочий день"
                  : "Есть пересечение задач, но по часам день не перегружен"
              }
            />
          ))}

          {showToday && <div className="tl-today-line" style={{ left: todayLeft }} />}

          {laid.tasks.map((task) => {
            const originalStart = parseISO(task.start);
            const originalEnd = parseISO(task.end);
            const start = originalStart < rangeStart ? rangeStart : originalStart;
            const end = originalEnd > rangeEnd ? rangeEnd : originalEnd;
            const left = daysBetween(rangeStart, start) * dayWidth + 3;
            const width = Math.max((daysBetween(start, end) + 1) * dayWidth - 6, 10);
            const top = task.lane * rowHeight + 5;
            const isSelected = task.id === selectedId;
            const dim = selectedId && !isSelected;
            const allocation = getTaskPlannedHoursByWorkingDate(task);
            const visibleDates = Array.from(allocation.keys()).filter((date) => {
              const parsed = parseISO(date);
              return parsed >= rangeStart && parsed <= rangeEnd;
            });
            const isSelectedDaysTask =
              task.schedule.mode === "selected_days" && visibleDates.length > 0;

            if (isSelectedDaysTask) {
              const sortedDates = visibleDates.sort();
              const bridgeStart = parseISO(sortedDates[0]);
              const bridgeEnd = parseISO(sortedDates[sortedDates.length - 1]);
              const bridgeSegments: Array<{ left: number; width: number; key: string }> = [];
              let segmentStart: Date | null = null;

              for (
                let cursor = new Date(bridgeStart);
                cursor <= bridgeEnd;
                cursor.setDate(cursor.getDate() + 1)
              ) {
                const currentDay = new Date(cursor);
                const workingDay = !isNonWorkingDay(currentDay);

                if (workingDay && !segmentStart) {
                  segmentStart = currentDay;
                }

                const nextDay = new Date(currentDay);
                nextDay.setDate(nextDay.getDate() + 1);
                const closesSegment =
                  segmentStart && (!workingDay || nextDay > bridgeEnd || isNonWorkingDay(nextDay));

                if (closesSegment) {
                  const startDate = segmentStart;
                  if (!startDate) continue;

                  const segmentEnd = workingDay
                    ? currentDay
                    : new Date(currentDay.getTime() - 86400000);
                  const left = daysBetween(rangeStart, startDate) * dayWidth + 3;
                  const width = Math.max(
                    (daysBetween(startDate, segmentEnd) + 1) * dayWidth - 6,
                    10,
                  );

                  bridgeSegments.push({
                    left,
                    width,
                    key: `${startDate.toISOString()}-${segmentEnd.toISOString()}`,
                  });
                  segmentStart = null;
                }
              }

              return (
                <div
                  key={task.id}
                  className={`tl-bar-group ${isSelected ? "selected" : ""} ${dim ? "dim" : ""}`}
                  style={{ top }}
                >
                  {bridgeSegments.map((segment) => (
                    <div
                      key={segment.key}
                      className="tl-bar-bridge"
                      data-status={task.status}
                      style={{ left: segment.left, width: segment.width }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(task.id);
                      }}
                      title={`${task.title} · ${fmtDateShort(originalStart)} → ${fmtDateShort(originalEnd)} · ${STATUS[task.status].label}`}
                    />
                  ))}
                  {sortedDates.map((date, index) => {
                    const day = parseISO(date);
                    const segmentLeft = daysBetween(rangeStart, day) * dayWidth + 3;
                    const segmentWidth = Math.max(dayWidth - 6, 10);
                    const showTitle = index === 0;

                    return (
                      <div
                        key={`${task.id}-${date}`}
                        className={`tl-bar tl-bar-segment ${isSelected ? "selected" : ""} ${dim ? "dim" : ""} ${segmentWidth < 80 ? "tight" : ""} ${segmentWidth < 48 ? "very-tight" : ""}`}
                        data-status={task.status}
                        style={
                          {
                            left: segmentLeft,
                            width: segmentWidth,
                            top: 0,
                            "--bar-prio":
                              task.priority === "high"
                                ? "var(--p-high)"
                                : task.priority === "med"
                                  ? "var(--p-med)"
                                  : "var(--p-low)",
                          } as CSSProperties
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelect(task.id);
                        }}
                        title={`${task.title} · ${fmtDateShort(day)} · ${allocation.get(date)}ч`}
                      >
                        <span className="bar-prio" />
                        {showTitle && <span className="bar-title">{task.title}</span>}
                        {showTitle && <span className="bar-meta">{task.effortHours}ч</span>}
                        {showTitle && (
                          <button
                            className="bar-delete"
                            title="Удалить задачу"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (window.confirm(`Удалить задачу «${task.title}»?`)) {
                                void onDelete(task.id);
                              }
                            }}
                          >
                            <Icon.x />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }

            return (
              <div
                key={task.id}
                className={`tl-bar ${isSelected ? "selected" : ""} ${dim ? "dim" : ""} ${width < 80 ? "tight" : ""} ${width < 48 ? "very-tight" : ""}`}
                data-status={task.status}
                style={
                  {
                    left,
                    width,
                    top,
                    "--bar-prio":
                      task.priority === "high"
                        ? "var(--p-high)"
                        : task.priority === "med"
                          ? "var(--p-med)"
                          : "var(--p-low)",
                  } as CSSProperties
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(task.id);
                }}
                title={`${task.title} · ${fmtDateShort(originalStart)} → ${fmtDateShort(originalEnd)} · ${STATUS[task.status].label}`}
              >
                <span className="bar-prio" />
                <span className="bar-title">{task.title}</span>
                <span className="bar-meta">{task.effortHours}ч</span>
                <button
                  className="bar-delete"
                  title="Удалить задачу"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (window.confirm(`Удалить задачу «${task.title}»?`)) {
                      void onDelete(task.id);
                    }
                  }}
                >
                  <Icon.x />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
