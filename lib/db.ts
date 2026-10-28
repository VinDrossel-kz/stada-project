import 'server-only';
import { Pool, type PoolClient } from 'pg';

const globalForDb = globalThis as unknown as { stadaPool?: Pool };

/** One pool per server process; kept on globalThis so dev hot reloads don't leak connections. */
export const db = globalForDb.stadaPool ??= new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://stada:stada@localhost:5433/stada',
  max: 10,
});

export async function transaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
