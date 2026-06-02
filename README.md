# Import Calculator Web App

Mobile-first web app MVP for import cost calculations. The app is independent from Telegram and currently uses mock data while the Supabase backend is being connected.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase-ready data model

## Pages

- `/calculations` - calculation history
- `/calculations/new` - create a new calculation
- `/calculations/[id]` - calculation details

## Project Structure

```text
app/
  calculations/
    [id]/
    new/
components/
  AppShell.tsx
  MobileHeader.tsx
  StatusBadge.tsx
  CalculationCard.tsx
  NewCalculationForm.tsx
  FileUploadZone.tsx
  EmptyState.tsx
lib/
  mock-data.ts
  status.ts
  types.ts
  supabase/client.ts
supabase/
  schema.sql
```

## Statuses

The internal statuses are:

- `need_more_data` - Нужно уточнение
- `ready_for_confirmation` - Готово к подтверждению
- `processing` - Расчёт выполняется
- `completed` - Расчёт выполнен
- `error` - Ошибка

## Routes

The data model already includes `route_code` for future delivery route selection. The MVP default is `china-russia`.

## Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill Supabase values when the backend is ready:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase

The starter schema is in `supabase/schema.sql` and includes:

- `profiles`
- `calculations`
- `calculation_files`

The schema enables RLS and keeps user data scoped by `auth.uid()`.
