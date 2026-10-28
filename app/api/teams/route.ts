import { addTeam, loadRoster, removeTeam } from '@/lib/roster';
import { rosterChange } from '@/lib/roster-route';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

/** Public roster: teams with their members. */
export async function GET() {
  try {
    return Response.json({ teams: await loadRoster() }, { headers });
  } catch (error) {
    console.error('Load roster failed', error);
    return Response.json({ error: 'Составы временно недоступны.' }, { status: 503, headers });
  }
}

/** Add a team: { name }. */
export function POST(request: Request) {
  return rosterChange(request, false, (_, body) => addTeam(body.name));
}

/** Remove a team with its scores: { id }. Admin only. */
export function DELETE(request: Request) {
  return rosterChange(request, true, (_, body) => removeTeam(body.id));
}
