# 02 — Language & UX Rules (HARD RULES — never violate)

## Naming / copy
- **NEVER** write "Pomodoro / Focus Duration" anywhere. In-app timer labels and settings use **"Focus Duration"** only. Applies to Classroom AND Corporate profiles.
- **"Pomodoro-style"** is permitted ONLY on the landing/profile-select page tagline and marketing copy. Never on in-app controls.
- **"Lane" is internal jargon.** Fine in code identifiers (`accommodationLanes`, `laneId`) and comments; NEVER in user-facing copy — UI labels, headings, confirm dialogs, page metadata, FAQ answers, or marketing prose. Public copy says **"timing group"**; "accommodation group" is the acceptable variant when pairing with the word "accommodation". Every public string must pass the read-aloud test.

## Controls
- Classroom focus slider minimum stays at **0m**. Do not raise the floor.

## Data (DECIDED — compliance rule)
- Testing / administration logs store **initials and seat numbers ONLY**. NEVER full student names or other PII. This keeps the product out of the heaviest FERPA/COPPA scope. Do not add a field that captures student full names, DOB, or IDs without an explicit compliance review.

## Architecture (DECIDED)
- UI stays single-file in `app/page.tsx`. Deliver full-file rewrites for UI changes.
- Backend logic goes in server files only (`app/api/**`, `lib/**`). Secrets in `.env.local`, never in `page.tsx`, never committed.

## UX principles (design intent to preserve)
- Front-of-room legibility first: everything must read across a room on a projector.
- Calm transitions — keep new transitions consistent with the CalmCountdown amber-to-indigo wash.
- Operable without a manual: primary actions reachable in one tap/keypress.

## Before shipping any change
- Check labels against the naming rules above.
- If it touches student data, confirm it stays initials/seat-only.
