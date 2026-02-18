# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite frontend (port 3088)
npm run server     # Start Express backend (port 3001)
npm run start      # Start both frontend and backend in parallel
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

There are no automated tests in this project.

## Architecture

**Full-stack React + Node.js application** — an interactive narrative/game system with faction mechanics.

- **Frontend:** `src/main.tsx` → `src/App.tsx` → `src/components/MapTestView.tsx` (the central hub)
- **Backend:** Express server at `server/index.ts` (port 3001), Prisma ORM over SQLite
- **Cloud sync:** Supabase (PostgreSQL) for user auth and persistence
- **API client:** `src/api/client.ts` — unified interface for admin, liquidator, and user operations

### Data Persistence

Two-layer persistence: SQLite (local game logic via Prisma) + Supabase (cloud user sync). Session data also uses `localStorage`.

Database schema is a single `td_users` table in `prisma/schema.prisma`.

### Game Systems

**Faction System:** Every user belongs to either "Turbid" (purple, `#9333ea`) or "Pure" (yellow, `#eab308`). Faction determines map visibility, content filtering, and balance scale state.

**Identity Roles:**
- `citizen` — default
- `apostate_ch1` / `apostate_ch3` — selected apostates (symmetric per faction: equal counts each side)
- `liquidator` — can scan for apostates

**Apostate System flow:** Quiz → high-affinity candidates → admin lottery (`/api/admin/lottery`) → symmetric selection → special abilities unlock.

**Admin access:** Username `vonn` / password `0112` grants ROOT privileges, bypasses faction restrictions, and unlocks all admin endpoints.

### Key Frontend Components

| Component | Role |
|-----------|------|
| `MapTestView.tsx` | Central hub: map, landmarks, fog, HUD, all subsystems |
| `ApostateSystem.tsx` | Affinity quiz and apostate abilities |
| `LiquidatorSystem.tsx` | Scan mechanics |
| `AdminApostateControl.tsx` | Admin lottery UI |
| `CentralBalanceScale.tsx` | Faction power visualization |
| `FogLayer.tsx` | Fog of war / faction visibility |
| `ReportSystemLogic.ts` | User auth and Supabase sync |
| `src/constants/index.ts` | `MAP_CONFIG`, `Z_INDEX`, `PERFORMANCE_CONFIG` |

### Z-Index Layering

Defined in `src/constants/index.ts`: HUD at 50, modals at 70, dev panel at 200.

### Performance Patterns

Components use `React.memo` + `useMemo`. GPU acceleration via `will-change` CSS. Blur effects kept minimal (4px). Debounce/throttle via `PERFORMANCE_CONFIG` from constants.

## Environment Variables

Copy `.env.example` to `.env`:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key
- `VITE_API_URL` — Express backend (defaults to `http://localhost:3001/api`)
- `DATABASE_URL` — SQLite path (defaults to `file:./dev.db`)

## Tech Stack

React 18 + TypeScript, Vite 5 (SWC), Tailwind CSS 3.4, Framer Motion 12, React Spring 10, Use-Gesture 10, Express 5, Prisma 7, Better-SQLite3, Supabase.
