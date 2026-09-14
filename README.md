# STADA Borovoe Summit

Public leaderboard and agenda, deployable to Vercel with the Next.js preset.

## Vercel

Import this repository, keep the root directory at ./, and use the Next.js preset.
Build settings are defined in vercel.json. No environment variables are required.

Run npm ci, npm run build, and npm start to test the production build locally.

## Existing live data and organizer access

The Vercel site reads public scores through a server-side, uncached request to
https://stada-borovoe-summit.miashecks.chatgpt.site/api/scores.
The organizer button redirects to that site's /admin page, where the existing
ChatGPT sign-in and score editing continue to work. Vercel does not accept score
writes or trust incoming ChatGPT identity headers.

The original ChatGPT site must remain available. This is a frontend hosting
migration, not a database or authentication migration. Original Cloudflare
support files remain in the repository for reference; do not deploy this
Next.js branch back to ChatGPT Sites without restoring its original build.
