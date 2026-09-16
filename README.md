# STADA Borovoe Summit

Public leaderboard and agenda, deployable to Vercel with the Next.js preset.

## Vercel

Import this repository, keep the root directory at ./, and use the Next.js preset.
Build settings are defined in vercel.json. No environment variables are required.

Run npm ci, npm run build, and npm start to test the production build locally.

## Existing live data and organizer access

The Vercel site reads public scores through a server-side, uncached request to
https://stada-borovoe-summit.miashecks.chatgpt.site/api/scores.
The organizer page is served at `/admin` on the same Vercel site. It requires
the organizer password and keeps the moderator session in a secure, HTTP-only
cookie. Authenticated score updates are proxied server-side to the existing
Sites database; the password is never included in client JavaScript.

The original ChatGPT site must remain available because it owns the score
database. This is a frontend hosting migration, not a database migration.
