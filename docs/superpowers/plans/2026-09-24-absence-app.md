# Absence App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement student absence application with authentication (email, password, NISN), Supabase integration, full navigation tabs (Beranda, Ajukan Izin, Riwayat), dynamic check-in/out logic, and responsive mobile-first UI for SMK Negeri 1 Kepanjen.

**Architecture:** App Router structure with route groups `(auth)` for login/register and `(app)` for authenticated pages sharing a mobile shell layout with top header and bottom navigation. Client-side Supabase client handles auth state and RLS-protected queries against `profiles`, `attendances`, and `leaves` tables.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Supabase (`@supabase/ssr`, `@supabase/supabase-js`).

**Spec:** `docs/superpowers/specs/2026-09-24-absence-app-design.md`

## Global Constraints
- Zero emojis across the entire UI and code.
- No `lucide-react` or external icon libraries; all icons inline SVG.
- Responsive container: centered max-width frame on desktop (`max-w-md`), fluid on mobile devices.
- Visual theme consistent with institutional blue/sky SMK Negeri 1 Kepanjen styling.
- All code strictly typed with TypeScript.

---

### Task 1: Supabase Database Schema Script

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Consumes: Supabase auth schema (`auth.users`)
- Produces: `public.profiles`, `public.attendances`, `public.leaves` tables with RLS and trigger

- [ ] **Step 1: Write SQL migration file**
Create `supabase/schema.sql` defining profiles, attendances, leaves, RLS policies, and user registration trigger.

- [ ] **Step 2: Verify SQL syntax correctness**
Run node assertion script to verify file contains all table definitions and RLS directives.

- [ ] **Step 3: Commit**
```bash
git add supabase/schema.sql
git commit -m "feat: add supabase schema migration script"
```

---

### Task 2: Supabase Browser Client Singleton

**Files:**
- Create: `lib/supabase.ts`
- Test: `lib/supabase.test.ts` or verify build

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_SUPABASE_URL`, `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Produces: `createClient()` returning browser Supabase client

- [ ] **Step 1: Write `lib/supabase.ts`**
Use `createBrowserClient` from `@supabase/ssr` with env fallback.

- [ ] **Step 2: Test client initialization**
Create simple validation check ensuring client exports proper functions.

- [ ] **Step 3: Commit**
```bash
git add lib/supabase.ts
git commit -m "feat: add supabase browser client"
```

---

### Task 3: Authentication Pages (Login & Register)

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`

**Interfaces:**
- Consumes: `lib/supabase.ts`
- Produces: Login with email + password; Register with email, password, NISN, full name; redirection to `/`.

- [ ] **Step 1: Create Register page**
Create `app/(auth)/register/page.tsx` with email, password, NISN, and full name fields, matching institutional styling.

- [ ] **Step 2: Create Login page**
Create `app/(auth)/login/page.tsx` with email and password inputs, error alerts, and redirect to `/`.

- [ ] **Step 3: Verify build**
Run `npm run build` to confirm pages compile without syntax/type errors.

- [ ] **Step 4: Commit**
```bash
git add app/\(auth\)/
git commit -m "feat: add login and register pages"
```

---

### Task 4: Shared App Shell & Navigation Layout

**Files:**
- Create: `app/(app)/layout.tsx`

**Interfaces:**
- Consumes: Current route path via `usePathname`
- Produces: Shared container frame with institutional header (logo, school name, theme/logout buttons) and bottom navigation bar linking to `/`, `/izin`, and `/riwayat`.

- [ ] **Step 1: Create `app/(app)/layout.tsx`**
Extract and adapt mobile frame container, top header with school branding and logout button, and sticky bottom navigation with active tab highlighting.

- [ ] **Step 2: Verify layout with test route**
Run `npm run build` to verify route group compilation.

- [ ] **Step 3: Commit**
```bash
git add app/\(app\)/layout.tsx
git commit -m "feat: add shared app layout and bottom navigation"
```

---

### Task 5: Absence Dashboard (`/`)

**Files:**
- Modify: `app/(app)/page.tsx` (move to `(app)` group or update root dashboard)

**Interfaces:**
- Consumes: Supabase user session, `attendances` table for today and month stats
- Produces: Live clock, dynamic user profile header (name, NISN, role), stats counter (Hadir, Telat, Izin, Alpha), tap button for check-in/check-out.

- [ ] **Step 1: Implement Dashboard logic**
Connect Supabase to fetch user profile, today's attendance record, and monthly aggregates. Implement check-in (Hadir <= 07:00, Telat > 07:00) and check-out button tap handler.

- [ ] **Step 2: Verify responsive design and interactive states**
Ensure UI handles loading, unauthenticated redirect to `/login`, and tap feedback states.

- [ ] **Step 3: Commit**
```bash
git add app/\(app\)/page.tsx
git commit -m "feat: implement live absence dashboard and tap logic"
```

---

### Task 6: Ajukan Izin Page (`/izin`)

**Files:**
- Create: `app/(app)/izin/page.tsx`

**Interfaces:**
- Consumes: `lib/supabase.ts`, `leaves` table
- Produces: Leave submission form (Type: Izin/Sakit, Date, Notes) and list of user's past leave submissions.

- [ ] **Step 1: Implement Leave request form & history**
Create form for submitting leave requests to `leaves` table and display submitted requests with status badges.

- [ ] **Step 2: Verify build & types**
Run `npm run build` to ensure type safety.

- [ ] **Step 3: Commit**
```bash
git add app/\(app\)/izin/page.tsx
git commit -m "feat: add ajukan izin form and submissions list"
```

---

### Task 7: Riwayat Presensi Page (`/riwayat`)

**Files:**
- Create: `app/(app)/riwayat/page.tsx`

**Interfaces:**
- Consumes: `attendances` and `leaves` tables for the logged-in user
- Produces: Filterable or chronological list of attendance and leave entries with check-in/out times and status badges.

- [ ] **Step 1: Implement Riwayat page**
Display complete history of attendance entries and approved/pending leaves with clean institutional styling and zero emojis.

- [ ] **Step 2: Verify build & lint**
Run `npm run build && npm run lint`.

- [ ] **Step 3: Commit**
```bash
git add app/\(app\)/riwayat/page.tsx
git commit -m "feat: add riwayat presensi page"
```

---

### Task 8: Verification & Cleanup

**Files:**
- Cleanup / replace old `app/page.tsx` if needed to route correctly to `(app)`

- [ ] **Step 1: Route cleanup**
Ensure no route conflicts between root `app/page.tsx` and `app/(app)/page.tsx`.

- [ ] **Step 2: Production build validation**
Run `npm run build` and ensure zero errors and clean output ready for Vercel deployment.

- [ ] **Step 3: Final Commit**
```bash
git add -A
git commit -m "chore: complete absence application and verify build"
```
