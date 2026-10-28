# STADA Grand Prix — LET'S MAX 2026

Live leaderboard and agenda for an in-person conference: 14 teams, 9 games, a personal schedule for every participant, a projector screen, and an organizer panel backed by its own PostgreSQL database.

## Quick start (Docker)

Requires Docker Desktop.

```bash
docker compose up --build
```

Open **http://localhost:3000**. The organizer panel is at **/admin**:

| Login | Password |
| --- | --- |
| `admin` | `stada2026` |

On first start the database is created and filled with the teams, participants, games and the current scores. Data lives in the `pgdata` volume; `docker compose down -v` resets everything to that starting point.

To pick a different first password: `ADMIN_PASSWORD=... docker compose up --build` (only applies to a fresh database).
If port 3000 is taken: `APP_PORT=3100 docker compose up --build` → http://localhost:3100.

## Pages

| Route | What |
| --- | --- |
| `/` | Leaderboard: places, race-track progress, per-game breakdown; refreshes every 10 s |
| `/teams` | Team rosters with search; “find yourself” remembers the participant |
| `/agenda` | Conference programme, general or personal for the selected participant's team |
| `/briefing` | Safety briefing presentation |
| `/broadcast` | Full-screen leaderboard for the projector: rank changes, best team per game, latest results, ticker. Esc exits |
| `/admin` | Organizer panel |

## Organizer panel

- **Score grid** — all teams × games in one table, Enter/Tab navigation, “Save all” (Ctrl+S), unsaved cells highlighted, the place column shows how places will change before saving.
- **Live sync** — refreshes every 15 s; cells changed by another organizer flash, conflicting edits are outlined instead of silently overwritten.
- **Change journal** — every change with author, time and old → new value; the latest change of a cell can be reverted.
- **Organizers** — the owner adds judges, resets passwords and switches accounts off; everyone can change their own password.
- **QR code** of the site for the screen, and a launcher for the projector view.

## Backend

- **PostgreSQL** (`db/schema.sql`): teams, members, games, scores, `score_log` (journal), organizers, settings. `db/migrate.mjs` applies the schema on every start and seeds an empty database from `db/seed.json`.
- **API** (Next.js route handlers):
  - `GET /api/scores` — public scoreboard.
  - `PATCH /api/scores` — save one cell `{ teamId, gameId, score, previous }`. The row is locked and `previous` must match the stored value, so two organizers can't overwrite each other unnoticed (409 otherwise). Each change is written to the journal in the same transaction.
  - `GET/POST /api/admin/log` — journal; revert an entry `{ id }`.
  - `GET/POST/PATCH /api/admin/organizers` — accounts (owner) and own password.
  - `POST /api/admin/login`, `/api/admin/logout`.
- **Security**: passwords hashed with scrypt; sessions are HMAC-signed HTTP-only cookies (`SESSION_SECRET`, or a random key kept in the database) that carry a per-account version, so changing a password or switching an account off ends its sessions; 5 failed logins lock the login+IP pair for a minute; state-changing requests must come from the site's own origin.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgres://stada:stada@localhost:5433/stada` | PostgreSQL connection |
| `ADMIN_LOGIN`, `ADMIN_PASSWORD` | `admin`, `stada2026` | First owner account for a fresh database |
| `SESSION_SECRET` | random, stored in DB | Session signing key |
| `INSECURE_COOKIES` | — | `1` allows session cookies over plain http (set in Docker for localhost) |

## Development without the app container

```bash
npm ci
npm run db:up        # PostgreSQL only, on localhost:5433
npm run db:migrate   # schema + seed
npm run dev          # http://localhost:3000
```

## Project layout

```
app/                 pages, API routes and components
  admin/             organizer panel: score grid, journal, organizers, QR
  broadcast/         projector screen
  agenda/ teams/ briefing/
  api/               scores, journal, organizers, login/logout
db/                  schema, migration + seed script, seed data
lib/                 database pool, sessions, passwords, scores, rate limit
public/              images and the briefing presentation
Dockerfile           standalone Next.js image
docker-compose.yml   app + PostgreSQL
```
