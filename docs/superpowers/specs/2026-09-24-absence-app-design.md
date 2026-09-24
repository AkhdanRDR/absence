# Absence App Design Specification

## Overview
Student attendance application for SMK Negeri 1 Kepanjen using Next.js App Router, Tailwind CSS, and Supabase serverless backend.

## Routing Architecture
- `lib/supabase.ts`: Supabase browser client singleton.
- `app/(auth)/login/page.tsx`: Authentication login page.
- `app/(auth)/register/page.tsx`: Registration page with Email, Password, NISN, Full Name.
- `app/(app)/layout.tsx`: Shared frame shell with school header and 3-tab bottom navigation (`Beranda`, `Ajukan Izin`, `Riwayat`).
- `app/(app)/page.tsx`: Attendance dashboard, live clock, real-time status, stats counters, check-in/out tap button.
- `app/(app)/izin/page.tsx`: Leave request form (Izin/Sakit, date, notes) and user submission history.
- `app/(app)/riwayat/page.tsx`: Attendance and leave history logs.

## Database Schema (`supabase/schema.sql`)

### Tables
1. `public.profiles`
   - `id`: `uuid primary key references auth.users(id) on delete cascade`
   - `nisn`: `text unique not null`
   - `full_name`: `text not null`
   - `role`: `text default 'Siswa Reguler'`
   - `created_at`: `timestamptz default now()`

2. `public.attendances`
   - `id`: `uuid primary key default gen_random_uuid()`
   - `user_id`: `uuid references public.profiles(id) on delete cascade not null`
   - `date`: `date not null default current_date`
   - `check_in`: `timestamptz default now()`
   - `check_out`: `timestamptz`
   - `status`: `text not null check (status in ('Hadir', 'Telat', 'Izin', 'Sakit', 'Alpha'))`
   - `notes`: `text`
   - `unique(user_id, date)`

3. `public.leaves`
   - `id`: `uuid primary key default gen_random_uuid()`
   - `user_id`: `uuid references public.profiles(id) on delete cascade not null`
   - `date`: `date not null`
   - `type`: `text not null check (type in ('Izin', 'Sakit'))`
   - `notes`: `text not null`
   - `status`: `text default 'Pending' check (status in ('Pending', 'Disetujui', 'Ditolak'))`
   - `created_at`: `timestamptz default now()`

### Security & Triggers
- RLS enabled on all three tables.
- Row policies restrict read/write to `auth.uid() = user_id` (or `auth.uid() = id` for `profiles`).
- Trigger on `auth.users` creation inserts row into `public.profiles` using `raw_user_meta_data`.

## Attendance Logic
- Cutoff: 07:00 local time.
- Tap button state:
  1. Belum Absen Masuk: Click inserts attendance record (`status = 'Hadir'` if `<= 07:00`, else `'Telat'`).
  2. Sudah Absen Masuk: Click updates attendance record setting `check_out = now()`.
  3. Sudah Absen Pulang: Button disabled with label "Presensi Selesai".

## UI Constraints
- Zero emojis.
- No `lucide-react` or external icon libraries; inline SVG only.
- Responsive mobile container centered on desktop (`max-w-md`), edge-to-edge on mobile.
- Clean institutional theme adhering to existing SMK Negeri 1 Kepanjen branding.
