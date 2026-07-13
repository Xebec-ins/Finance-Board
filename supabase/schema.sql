-- Run this once in the Supabase SQL editor for your project.

-- ── Categories ────────────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6b7280',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "categories_select_own" on categories
  for select using (auth.uid() = user_id);
create policy "categories_insert_own" on categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on categories
  for update using (auth.uid() = user_id);
create policy "categories_delete_own" on categories
  for delete using (auth.uid() = user_id);

-- ── Monthly budgets ──────────────────────────────────────────
create table if not exists monthly_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null, -- always the 1st of the month
  income_amount numeric(12, 2) not null default 0,
  savings_goal_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table monthly_budgets enable row level security;

create policy "monthly_budgets_select_own" on monthly_budgets
  for select using (auth.uid() = user_id);
create policy "monthly_budgets_insert_own" on monthly_budgets
  for insert with check (auth.uid() = user_id);
create policy "monthly_budgets_update_own" on monthly_budgets
  for update using (auth.uid() = user_id);
create policy "monthly_budgets_delete_own" on monthly_budgets
  for delete using (auth.uid() = user_id);

-- ── Transactions ─────────────────────────────────────────────
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount numeric(12, 2) not null,
  merchant text,
  note text,
  date date not null default current_date,
  receipt_path text,
  source text not null default 'manual' check (source in ('manual', 'ocr')),
  created_at timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "transactions_select_own" on transactions
  for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on transactions
  for insert with check (auth.uid() = user_id);
create policy "transactions_update_own" on transactions
  for update using (auth.uid() = user_id);
create policy "transactions_delete_own" on transactions
  for delete using (auth.uid() = user_id);

create index if not exists transactions_user_date_idx on transactions (user_id, date desc);

-- ── Storage bucket for receipt photos ───────────────────────
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "receipts_select_own" on storage.objects
  for select using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipts_insert_own" on storage.objects
  for insert with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipts_update_own" on storage.objects
  for update using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "receipts_delete_own" on storage.objects
  for delete using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── User preferences ────────────────────────────────────────
create table if not exists user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'INR'
);

alter table user_preferences enable row level security;

create policy "prefs_select_own" on user_preferences
  for select using (auth.uid() = user_id);
create policy "prefs_insert_own" on user_preferences
  for insert with check (auth.uid() = user_id);
create policy "prefs_update_own" on user_preferences
  for update using (auth.uid() = user_id);

-- ── Seed default categories for a new user ──────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.categories (user_id, name, color, is_default) values
    (new.id, 'Food & Groceries', '#2a78d6', true),
    (new.id, 'Rent & Bills', '#1baf7a', true),
    (new.id, 'Transport', '#eda100', true),
    (new.id, 'Shopping', '#008300', true),
    (new.id, 'Entertainment', '#4a3aa7', true),
    (new.id, 'Other', '#e34948', true);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
