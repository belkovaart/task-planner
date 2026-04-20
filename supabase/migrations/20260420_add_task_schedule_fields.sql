alter table public.tasks
  add column if not exists effort_hours numeric(10,2),
  add column if not exists schedule_mode text not null default 'auto',
  add column if not exists daily_hours numeric(10,2);

update public.tasks
set
  effort_hours = coalesce(effort_hours, effort * 5),
  schedule_mode = coalesce(schedule_mode, 'auto')
where effort_hours is null
   or schedule_mode is null;

alter table public.tasks
  alter column effort_hours set default 0,
  alter column effort_hours set not null;

alter table public.tasks
  alter column schedule_mode set default 'auto';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_schedule_mode_check'
  ) then
    alter table public.tasks
      add constraint tasks_schedule_mode_check
      check (schedule_mode in ('auto', 'daily'));
  end if;
end $$;
