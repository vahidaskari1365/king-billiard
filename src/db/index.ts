import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Lazy database client — the app works WITHOUT a database.
 * A connection is only created on first actual query and only when
 * DATABASE_URL is configured.
 */

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: NodePgDatabase;
};

export function getDb(): NodePgDatabase | null {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: databaseUrl,
    });
  }

  if (!globalForDb.__arenaNextJsPostgresqlDb) {
    globalForDb.__arenaNextJsPostgresqlDb = drizzle(
      globalForDb.__arenaNextJsPostgresqlPool,
    );
  }

  return globalForDb.__arenaNextJsPostgresqlDb;
}

/** Optional proxy kept for compatibility — never throws at import time. */
export const db = new Proxy({} as NodePgDatabase, {
  get(_target, prop) {
    const real = getDb();
    if (!real) {
      throw new Error("Database is not configured (DATABASE_URL missing)");
    }
    return real[prop as keyof NodePgDatabase];
  },
});

export function getPool(): Pool | null {
  return globalForDb.__arenaNextJsPostgresqlPool ?? null;
}

// For backward compatibility - getter that always returns current pool
export const pool = new Proxy({} as unknown as Pool, {
  get(_target, prop) {
    const p = getPool();
    if (!p) return null;
    return (p as unknown as Record<string | symbol, unknown>)[prop];
  },
}) as unknown as Pool | null;
