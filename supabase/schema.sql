create extension if not exists "pgcrypto";

create type public.calculation_status as enum (
  'need_more_data',
  'ready_for_confirmation',
  'processing',
  'completed',
  'error'
);

create type public.calculation_file_kind as enum (
  'invoice',
  'packing_list'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  route_code text not null default 'china-russia',
  product_name text not null,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_price numeric(14, 4) not null check (unit_price >= 0),
  currency text not null check (currency in ('CNY', 'USD', 'EUR', 'RUB')),
  status public.calculation_status not null default 'ready_for_confirmation',
  message text,
  invoice_total_foreign numeric(14, 2),
  exchange_rate numeric(14, 6),
  final_cost_rub numeric(14, 2),
  final_unit_cost_rub numeric(14, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.calculation_files (
  id uuid primary key default gen_random_uuid(),
  calculation_id uuid not null references public.calculations(id) on delete cascade,
  file_kind public.calculation_file_kind not null,
  file_name text not null,
  file_size integer not null check (file_size >= 0),
  storage_path text,
  created_at timestamptz not null default now()
);

create index calculations_profile_created_at_idx
  on public.calculations(profile_id, created_at desc);

create index calculations_status_idx
  on public.calculations(status);

create index calculation_files_calculation_id_idx
  on public.calculation_files(calculation_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger calculations_set_updated_at
before update on public.calculations
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.calculations enable row level security;
alter table public.calculation_files enable row level security;

create policy "Users can read their profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can upsert their profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can read their calculations"
  on public.calculations for select
  using (auth.uid() = profile_id);

create policy "Users can create their calculations"
  on public.calculations for insert
  with check (auth.uid() = profile_id);

create policy "Users can update their calculations"
  on public.calculations for update
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "Users can read files for their calculations"
  on public.calculation_files for select
  using (
    exists (
      select 1
      from public.calculations
      where calculations.id = calculation_files.calculation_id
        and calculations.profile_id = auth.uid()
    )
  );

create policy "Users can create files for their calculations"
  on public.calculation_files for insert
  with check (
    exists (
      select 1
      from public.calculations
      where calculations.id = calculation_files.calculation_id
        and calculations.profile_id = auth.uid()
    )
  );
