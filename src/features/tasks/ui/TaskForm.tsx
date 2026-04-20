import { useEffect, useMemo, useState } from "react";
import Chips from "../../../shared/ui/Chips";
import { addDays, fmtISO, pluralRu } from "../../../shared/lib/date";
import { makeTaskId } from "../../../shared/lib/ids";
import { draftDurationDays, validateTaskDraft, type TaskDraft } from "../model/task.schema";
import { PRIORITY, PRIORITY_ORDER, STATUS, STATUS_ORDER, type Task } from "../model/task.types";
import { Icon } from "./Icons";

interface TaskFormProps {
  editingTask: Task | null;
  today: Date;
  onAdd: (task: Task) => Promise<void>;
  onSave: (task: Task) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClear: () => void;
}

const makeBlankDraft = (today: Date): TaskDraft => ({
  title: "",
  url: "",
  effortHours: 5,
  start: fmtISO(today),
  end: fmtISO(addDays(today, 2)),
  status: "planned",
  priority: "med",
  schedule: {
    mode: "auto",
    hoursPerDay: 3,
  },
});

export default function TaskForm({
  editingTask,
  today,
  onAdd,
  onSave,
  onDelete,
  onClear,
}: TaskFormProps) {
  const isEdit = Boolean(editingTask);
  const blank = useMemo(() => makeBlankDraft(today), [today]);
  const [form, setForm] = useState<TaskDraft>(blank);
  const [estimateUnit, setEstimateUnit] = useState<"hours" | "days">("hours");
  const [touched, setTouched] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setForm({ ...editingTask });
      setEstimateUnit(editingTask.effortHours % 5 === 0 ? "days" : "hours");
      setTouched(false);
      return;
    }

    setForm(blank);
    setEstimateUnit("days");
    setTouched(false);
  }, [blank, editingTask]);

  const errors = validateTaskDraft(form);
  const hasErrors = Object.keys(errors).length > 0;
  const duration = draftDurationDays(form);
  const showErr = (key: keyof TaskDraft) => touched && errors[key];
  const estimateValue =
    estimateUnit === "days" ? Number(form.effortHours) / 5 : Number(form.effortHours);
  const effortTooltip = `${Number(form.effortHours)}ч / ${Number(form.effortHours) / 5}д`;

  const submit = async () => {
    setTouched(true);
    if (hasErrors) return;

    if (isEdit && editingTask) {
      await onSave({
        ...editingTask,
        ...form,
        effortHours: Number(form.effortHours),
        schedule: {
          ...form.schedule,
          hoursPerDay:
            form.schedule.mode === "daily" ? Number(form.schedule.hoursPerDay ?? 0) : undefined,
        },
      });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1200);
      return;
    }

    await onAdd({
      ...form,
      id: makeTaskId(),
      effortHours: Number(form.effortHours),
      schedule: {
        ...form.schedule,
        hoursPerDay:
          form.schedule.mode === "daily" ? Number(form.schedule.hoursPerDay ?? 0) : undefined,
      },
    });
    setForm(blank);
    setTouched(false);
  };

  return (
    <div className="form">
      <h2 className="form-heading">{isEdit ? "Редактирование" : "Новая задача"}</h2>

      <div className="field-group">
        <label>Название</label>
        <input
          className={`input ${showErr("title") ? "error" : ""}`}
          placeholder="Что нужно сделать"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        {showErr("title") && <div className="error-msg">{errors.title}</div>}
      </div>

      <div className="field-group">
        <label>
          Ссылка <span className="hint">необязательно</span>
        </label>
        <input
          className={`input ${showErr("url") ? "error" : ""}`}
          placeholder="https://"
          value={form.url}
          onChange={(event) => setForm({ ...form, url: event.target.value })}
        />
        {showErr("url") && <div className="error-msg">{errors.url}</div>}
      </div>

      <div className="field-row">
        <div className="field-group">
          <label>Начало</label>
          <input
            type="date"
            className="input"
            value={form.start}
            onChange={(event) => {
              const nextStart = event.target.value;
              const nextEnd = form.end < nextStart ? nextStart : form.end;
              setForm({ ...form, start: nextStart, end: nextEnd });
            }}
          />
        </div>
        <div className="field-group">
          <label>Окончание</label>
          <input
            type="date"
            className={`input ${showErr("end") ? "error" : ""}`}
            value={form.end}
            min={form.start}
            onChange={(event) => setForm({ ...form, end: event.target.value })}
          />
        </div>
      </div>
      {showErr("end") && <div className="error-msg">{errors.end}</div>}

      <div className="field-row">
        <div className="field-group">
          <label>
            <span>Оценка усилий</span>
            <span className="inline-toggle">
              <button
                type="button"
                className={estimateUnit === "hours" ? "active" : ""}
                onClick={() => setEstimateUnit("hours")}
              >
                Часы
              </button>
              <span className="sep">/</span>
              <button
                type="button"
                className={estimateUnit === "days" ? "active" : ""}
                onClick={() => setEstimateUnit("days")}
              >
                Дни
              </button>
            </span>
          </label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            className={`input ${showErr("effortHours") ? "error" : ""}`}
            title={effortTooltip}
            value={Number.isFinite(estimateValue) ? estimateValue : ""}
            onChange={(event) =>
              setForm({
                ...form,
                effortHours:
                  estimateUnit === "days"
                    ? Number(event.target.value) * 5
                    : Number(event.target.value),
              })
            }
          />
        </div>
        <div className="field-group">
          <label>Календарная длительность</label>
          <input
            className="input readonly mono"
            value={`${duration} ${pluralRu(duration, ["день", "дня", "дней"])}`}
            readOnly
          />
        </div>
      </div>
      {showErr("effortHours") && <div className="error-msg">{errors.effortHours}</div>}
      <div className="field-group">
        <label>Распределение нагрузки</label>
        <div className="segmented-control">
          <button
            type="button"
            className={form.schedule.mode === "auto" ? "active" : ""}
            onClick={() =>
              setForm({
                ...form,
                schedule: { mode: "auto" },
              })
            }
          >
            Авто
          </button>
          <button
            type="button"
            className={form.schedule.mode === "daily" ? "active" : ""}
            onClick={() =>
              setForm({
                ...form,
                schedule: {
                  mode: "daily",
                  hoursPerDay: form.schedule.hoursPerDay ?? 3,
                },
              })
            }
          >
            Часов в день
          </button>
        </div>
      </div>
      {form.schedule.mode === "daily" && (
        <div className="field-group">
          <label>
            Нагрузка в день <span className="hint">рабочие дни</span>
          </label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            className={`input ${showErr("schedule") ? "error" : ""}`}
            value={form.schedule.hoursPerDay ?? ""}
            onChange={(event) =>
              setForm({
                ...form,
                schedule: {
                  ...form.schedule,
                  hoursPerDay: Number(event.target.value),
                },
              })
            }
          />
          {showErr("schedule") && <div className="error-msg">{errors.schedule}</div>}
        </div>
      )}
      <div className="field-group">
        <label>Статус</label>
        <Chips
          scheme="status"
          value={form.status}
          options={STATUS_ORDER.map((key) => ({ key, label: STATUS[key].label }))}
          onChange={(value) => setForm({ ...form, status: value as Task["status"] })}
        />
      </div>

      <div className="field-group">
        <label>Приоритет</label>
        <Chips
          scheme="priority"
          value={form.priority}
          options={PRIORITY_ORDER.map((key) => ({ key, label: PRIORITY[key].label }))}
          onChange={(value) => setForm({ ...form, priority: value as Task["priority"] })}
        />
      </div>

      <div className="actions">
        {isEdit && editingTask ? (
          <>
            <button className="btn btn-primary" onClick={() => void submit()}>
              {savedFlash ? (
                <>
                  <Icon.check /> Сохранено
                </>
              ) : (
                <>Сохранить изменения</>
              )}
            </button>
            <div className="btn-row">
              <button className="btn" onClick={onClear}>
                Отменить
              </button>
              <button className="btn btn-danger" onClick={() => void onDelete(editingTask.id)}>
                <Icon.trash /> Удалить
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={() => void submit()}>
              <Icon.plus /> Добавить задачу
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setForm(blank);
                setTouched(false);
              }}
            >
              Очистить форму
            </button>
          </>
        )}
      </div>
    </div>
  );
}
