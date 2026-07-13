-- Migration v2: recurring bills, category budgets, tags, quick templates
-- Run this in the Supabase SQL editor.

-- ── Add tags column to transactions ─────────────────────────
alter table transactions add column if not exists tags text[] default '{}';

-- ── Recurring bill templates ────────────────────────────────
create table if not exists recurring_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount numeric(12, 2) not null,
  merchant text,
  note text,
  day_of_month int not null default 1 check (day_of_month between 1 and 28),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table recurring_templates enable row level security;

create policy "recurring_select_own" on recurring_templates
  for select using (auth.uid() = user_id);
create policy "recurring_insert_own" on recurring_templates
  for insert with check (auth.uid() = user_id);
create policy "recurring_update_own" on recurring_templates
  for update using (auth.uid() = user_id);
create policy "recurring_delete_own" on recurring_templates
  for delete using (auth.uid() = user_id);

-- ── Category budgets ────────────────────────────────────────
create table if not exists category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  month date not null,
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

alter table category_budgets enable row level security;

create policy "catbudget_select_own" on category_budgets
  for select using (auth.uid() = user_id);
create policy "catbudget_insert_own" on category_budgets
  for insert with check (auth.uid() = user_id);
create policy "catbudget_update_own" on category_budgets
  for update using (auth.uid() = user_id);
create policy "catbudget_delete_own" on category_budgets
  for delete using (auth.uid() = user_id);

-- ── Quick expense templates ─────────────────────────────────
create table if not exists quick_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount numeric(12, 2) not null,
  merchant text,
  label text not null,
  created_at timestamptz not null default now()
);

alter table quick_templates enable row level security;

create policy "quick_select_own" on quick_templates
  for select using (auth.uid() = user_id);
create policy "quick_insert_own" on quick_templates
  for insert with check (auth.uid() = user_id);
create policy "quick_update_own" on quick_templates
  for update using (auth.uid() = user_id);
create policy "quick_delete_own" on quick_templates
  for delete using (auth.uid() = user_id);
