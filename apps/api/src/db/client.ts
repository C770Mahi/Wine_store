import { Pool, QueryResultRow } from 'pg';
import { env } from '../config/env';

let pool: Pool | null = null;

if (env.databaseUrl) {
  pool = new Pool({ connectionString: env.databaseUrl });
}

export function hasDatabase() {
  return Boolean(pool);
}

export async function dbQuery<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  if (!pool) {
    throw new Error('Database connection is not configured');
  }

  return pool.query<T>(text, params);
}
