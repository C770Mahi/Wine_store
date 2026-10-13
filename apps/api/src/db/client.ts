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

type QueryResult<T extends QueryResultRow> = {
  rows: T[];
  rowCount: number | null;
};

type Queryable = {
  query<T extends QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
};

type TransactionClient = Queryable & {
  release(): void;
};

type ConnectablePool = Queryable & {
  connect(): Promise<TransactionClient>;
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

function createPool(connectionString: string): ConnectablePool {
  if (isLocalDatabase(connectionString)) {
    return new PgPool(buildPgPoolConfig(connectionString)) as unknown as ConnectablePool;
  }

  return new NeonPool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 30000
  }) as unknown as ConnectablePool;
}

let pool: ConnectablePool | null = null;

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

export async function dbTransaction<T>(work: (client: TransactionClient) => Promise<T>) {
  if (!pool) {
    throw new Error('Database connection is not configured');
  }

  const client = await pool.connect();

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
