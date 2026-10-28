// Creates the schema and, on an empty database, loads teams, games, current scores and the first owner.
// Runs before the server starts (see Dockerfile) and via `npm run db:migrate` locally.
import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const url = process.env.DATABASE_URL ?? 'postgres://stada:stada@localhost:5433/stada';
const client = new pg.Client({ connectionString: url });

// Postgres may still be starting when the app container boots.
for (let attempt = 1; ; attempt++) {
  try { await client.connect(); break; } catch (error) {
    if (attempt === 30) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(20260921)');
  await client.query(readFileSync(join(here, 'schema.sql'), 'utf8'));

  const { rows: [{ count }] } = await client.query('SELECT count(*)::int AS count FROM teams');
  if (count === 0) {
    const seed = JSON.parse(readFileSync(join(here, 'seed.json'), 'utf8'));
    for (const team of seed.teams) {
      await client.query('INSERT INTO teams (id, name) VALUES ($1, $2)', [team.id, team.name]);
      for (const [position, name] of team.members.entries()) {
        await client.query('INSERT INTO members (team_id, name, position) VALUES ($1, $2, $3)', [team.id, name, position]);
      }
    }
    for (const [position, game] of seed.games.entries()) {
      await client.query('INSERT INTO games (id, stage, name, position) VALUES ($1, $2, $3, $4)', [game.id, game.stage, game.name, position]);
    }
    for (const score of seed.scores) {
      await client.query('INSERT INTO scores (team_id, game_id, score, updated_at) VALUES ($1, $2, $3, $4)', [score.teamId, score.gameId, score.score, score.updatedAt ?? new Date()]);
    }
    console.log(`Seeded ${seed.teams.length} teams, ${seed.games.length} games, ${seed.scores.length} scores.`);
  }

  // Earlier versions named the first owner differently.
  await client.query("UPDATE organizers SET name = 'Админ' WHERE name = 'Главный организатор'");

  const { rows: owners } = await client.query("SELECT 1 FROM organizers WHERE role = 'owner' AND active LIMIT 1");
  if (owners.length === 0) {
    const login = process.env.ADMIN_LOGIN ?? 'admin';
    const password = process.env.ADMIN_PASSWORD ?? 'stada2026';
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
    await client.query(
      "INSERT INTO organizers (login, name, role, password_hash) VALUES ($1, 'Админ', 'owner', $2) ON CONFLICT (login) DO NOTHING",
      [login, `scrypt$16384$${salt.toString('base64')}$${hash.toString('base64')}`],
    );
    console.log(`Created owner account "${login}".`);
  }

  await client.query('COMMIT');
  console.log('Database is ready.');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
