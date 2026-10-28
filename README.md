# STADA Borovoe Summit

Leaderboard, team rosters, agenda and safety briefing for the LET'S MAX STADA 2026 conference. Built with Next.js and deployed to Vercel.

## Run locally

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build && npm start
```

## How it works

- **Scores** are read from and written to the existing ChatGPT Sites backend (`lib/site-backend.ts`), proxied server-side through `/api/scores`. That site must stay online — it owns the score database.
- **Organizer page** (`/admin`) is password-protected. The session lives in a secure, HTTP-only cookie; the password never reaches client JavaScript.
- **Teams and participants** are defined in `app/teams.ts`; games in `app/games.ts`; the agenda in `app/agenda-data.json`.

## Project layout

```
app/                 pages, API routes and app components
  admin/             organizer login and score editor
  agenda/ teams/ briefing/
  api/               scores proxy + organizer login/logout
components/ui/       table component
lib/                 organizer session, backend URL, utils
public/              images and the briefing presentation
```
