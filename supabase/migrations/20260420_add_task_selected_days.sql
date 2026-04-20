alter table public.tasks
  add column if not exists selected_dates jsonb;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'tasks_schedule_mode_check'
  ) then
    alter table public.tasks
      drop constraint tasks_schedule_mode_check;
  end if;
end $$;

alter table public.tasks
  alter column schedule_mode set default 'auto';

update public.tasks
set selected_dates = coalesce(selected_dates, '[]'::jsonb)
where schedule_mode = 'selected_days'
  and selected_dates is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_schedule_mode_check'
  ) then
    alter table public.tasks
      add constraint tasks_schedule_mode_check
      check (schedule_mode in ('auto', 'daily', 'selected_days'));
  end if;
end $$;
