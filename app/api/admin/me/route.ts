import { currentOrganizer } from '@/lib/organizer-session';
export const dynamic = 'force-dynamic';

/** Who is signed in, for the header. No cookie → null without touching the database. */
export async function GET() {
  let organizer = null;
  try { organizer = await currentOrganizer(); } catch {}
  return Response.json(
    { organizer: organizer && { name: organizer.name, role: organizer.role } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
