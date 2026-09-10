import {env} from 'cloudflare:workers';
import {initialTeams} from '../app/teams';
export function database(){if(!env.DB)throw new Error('Score storage unavailable');return env.DB}
export async function readTeams(){const db=database();await db.batch(initialTeams.map(t=>db.prepare('INSERT OR IGNORE INTO teams (id,name,score) VALUES (?,?,0)').bind(t.id,t.name)));return (await db.prepare('SELECT id,name,score,updated_at FROM teams ORDER BY id').all()).results}
