-- ============================================================
-- Whealth OS — Create goals table in Supabase
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  target_amount numeric(18,2) not null default 0,
  eta_year     int,
  icon         text,
  accent       text,
  linked_brokers text[] default '{}',
  manual_thb   numeric(18,2) default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-update updated_at on row changes
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists goals_updated_at on public.goals;
create trigger goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- Row Level Security: each user sees only their own goals
alter table public.goals enable row level security;

drop policy if exists "Users can select own goals"  on public.goals;
drop policy if exists "Users can insert own goals"  on public.goals;
drop policy if exists "Users can update own goals"  on public.goals;
drop policy if exists "Users can delete own goals"  on public.goals;

create policy "Users can select own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);
