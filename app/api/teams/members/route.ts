import { addMember, removeMember } from '@/lib/roster';
import { rosterChange } from '@/lib/roster-route';
export const dynamic = 'force-dynamic';

/** Add a participant: { teamId, name }. */
export function POST(request: Request) {
  return rosterChange(request, false, (_, body) => addMember(body.teamId, body.name));
}

/** Remove a participant: { teamId, name }. */
export function DELETE(request: Request) {
  return rosterChange(request, false, (_, body) => removeMember(body.teamId, body.name));
}
