-- Planner, phase 1: one settings row per user.
-- Every column the user fills in is nullable and has no default: nothing is assumed
-- until the setup form saves it. Safe to re-run.
-- Not applied automatically: run it in the Supabase SQL editor, then add it to supabase/schema.sql.

create table if not exists public.planner_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  spending_account_id uuid references public.accounts (id) on delete set null,
  salary_category_id uuid references public.categories (id) on delete set null,
  salary_day smallint check (salary_day between 1 and 31),
  floor_amount numeric(14, 2) check (floor_amount >= 0),
  expected_salary_amount numeric(14, 2) check (expected_salary_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The spending account must be a bank account and the salary category an income category.
-- These run as the signed-in user, so row-level security on accounts and categories also
-- guarantees both belong to that user.
create or replace function public.planner_settings_guard()
returns trigger
language plpgsql
as $$
begin
  if new.spending_account_id is not null and not exists (
    select 1 from public.accounts a where a.id = new.spending_account_id and a.type = 'bank'
  ) then
    raise exception 'The spending account must be one of your bank accounts.' using errcode = 'check_violation';
  end if;
  if new.salary_category_id is not null and not exists (
    select 1 from public.categories c where c.id = new.salary_category_id and c.kind = 'income'
  ) then
    raise exception 'The salary category must be one of your income categories.' using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists planner_settings_guard on public.planner_settings;
create trigger planner_settings_guard
  before insert or update on public.planner_settings
  for each row execute function public.planner_settings_guard();

alter table public.planner_settings enable row level security;

drop policy if exists planner_settings_select on public.planner_settings;
drop policy if exists planner_settings_insert on public.planner_settings;
drop policy if exists planner_settings_update on public.planner_settings;
drop policy if exists planner_settings_delete on public.planner_settings;

create policy planner_settings_select on public.planner_settings for select using (user_id = auth.uid());
create policy planner_settings_insert on public.planner_settings for insert with check (user_id = auth.uid());
create policy planner_settings_update on public.planner_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy planner_settings_delete on public.planner_settings for delete using (user_id = auth.uid());
