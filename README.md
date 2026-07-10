# RoomRhythm

Browser-based focus-block timer and test-day room clock. Next.js / React / TypeScript / Tailwind.

## Profiles
- **Classroom** — focus blocks for teachers/students.
- **Corporate** — focus blocks for training rooms.
- **Testing** — test-day timing & administration: section templates, mandated warning banners, extended-time accommodations, timestamped admin log.

## Run locally
```
npm install
npm run dev
```
Open http://localhost:3000.

## Structure
- `app/page.tsx` — the app UI (single-file front end).
- `public/sounds/` — timer audio (Web Audio API).
- `docs/` — product + build specs (also loaded by Claude Code via CLAUDE.md).
- `CLAUDE.md` — project rules Claude Code loads every session.

## Important
- Keep this project OUTSIDE OneDrive (Turbopack cache corruption).
- Secrets go in `.env.local` (gitignored) — never commit them.
- See `docs/00_SPEC_INDEX.md` for the full spec set and build order.
