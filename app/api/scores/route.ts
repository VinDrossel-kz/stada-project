import {database,readTeams} from '../../../db/scores';
import {isOrganizer} from '../../authorization';
export const dynamic='force-dynamic';
const options={headers:{'Cache-Control':'no-store'}};
export async function GET(){try{return Response.json({teams:await readTeams()},options)}catch(e){console.error('Load scores failed',e);return Response.json({error:'Scores are temporarily unavailable. Please retry.'},{status:503,...options})}}
export async function PATCH(request:Request){
if(!await isOrganizer())return Response.json({error:'Only the organizer can edit scores.'},{status:403,...options});
const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return Response.json({error:'Invalid request origin.'},{status:403,...options});
let data;try{data=await request.json() as {id:number;score:number;previous:number}}catch{return Response.json({error:'Invalid score request.'},{status:400,...options})}
const {id,score,previous}=data||{};if(!Number.isInteger(id)||id<1||id>14||!Number.isInteger(score)||score<0||score>1000000||!Number.isInteger(previous))return Response.json({error:'Enter a whole-number score from 0 to 1,000,000.'},{status:400,...options});
try{const result=await database().prepare('UPDATE teams SET score=?,updated_at=? WHERE id=? AND score=?').bind(score,new Date().toISOString(),id,previous).run();if(!result.meta.changes)return Response.json({error:'This score changed elsewhere. Reload scores before saving.'},{status:409,...options});return Response.json({teams:await readTeams()},options)}catch(e){console.error('Save score failed',e);return Response.json({error:'Score was not saved. Please retry.'},{status:503,...options})}}

