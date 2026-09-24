-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nisn text unique not null,
  full_name text not null,
  role text default 'Siswa Reguler',
  created_at timestamptz default now()
);

-- Attendances table
create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  check_in timestamptz default now(),
  check_out timestamptz,
  status text not null check (status in ('Hadir', 'Telat', 'Izin', 'Sakit', 'Alpha')),
  notes text,
  unique(user_id, date)
);

-- Leaves table
create table if not exists public.leaves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  type text not null check (type in ('Izin', 'Sakit')),
  notes text not null,
  status text default 'Pending' check (status in ('Pending', 'Disetujui', 'Ditolak')),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.attendances enable row level security;
alter table public.leaves enable row level security;

-- Profiles Policies
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Attendances Policies
create policy "Users can view own attendances"
  on public.attendances for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own attendances"
  on public.attendances for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own attendances"
  on public.attendances for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Leaves Policies
create policy "Users can view own leaves"
  on public.leaves for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own leaves"
  on public.leaves for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own leaves"
  on public.leaves for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Trigger function for new user registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nisn, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'nisn',
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'Siswa Reguler')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
