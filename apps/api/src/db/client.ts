import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool, PoolConfig, QueryResultRow } from 'pg';
import ws from 'ws';
import { env } from '../config/env';

class InsecureNeonWebSocket extends ws {
  constructor(address: string | URL, protocols?: string | string[]) {
    super(address, protocols, { rejectUnauthorized: false });
  }
}

neonConfig.webSocketConstructor = InsecureNeonWebSocket as unknown as NonNullable<typeof neonConfig.webSocketConstructor>;

type QueryablePool = {
  query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<{
    rows: T[];
    rowCount: number | null;
  }>;
};

function isLocalDatabase(connectionString: string) {
  try {
    const databaseUrl = new URL(connectionString);
    return ['localhost', '127.0.0.1'].includes(databaseUrl.hostname);
  } catch {
    return false;
  }
}

function buildPgPoolConfig(connectionString: string): PoolConfig {
  return {
    connectionString,
    connectionTimeoutMillis: 5000
  };
}

function createPool(connectionString: string): QueryablePool {
  if (isLocalDatabase(connectionString)) {
    return new PgPool(buildPgPoolConfig(connectionString));
  }

  return new NeonPool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 30000
  });
}

let pool: QueryablePool | null = null;

if (env.databaseUrl) {
  pool = createPool(env.databaseUrl);
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
