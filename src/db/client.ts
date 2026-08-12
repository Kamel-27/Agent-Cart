/**
 * Database access.
 *
 * Two drivers behind one `query()`:
 *
 *   DATABASE_URL set    node-postgres against a real server (Supabase, Neon, …)
 *   DATABASE_URL unset  PGlite, a file-backed Postgres compiled to WASM
 *
 * PGlite is the default so that `npm run dev` works with no infrastructure at
 * all. It is genuine Postgres — the same DDL, the same tsvector generated
 * column, the same JSONB operators — so moving to a hosted database later is a
 * connection-string change, not a rewrite.
 *
 * Deliberately no ORM. The catalog query composes a variable number of filter
 * predicates and the search query is hand-written; a query builder would hide
 * the SQL that matters most here while adding an adapter layer to debug.
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { DDL } from "./ddl";

export interface QueryResult<T> {
  rows: T[];
}

interface Driver {
  kind: "pglite" | "postgres";
  query<T>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  /** Multi-statement scripts. Both drivers reject these on the prepared-statement
   *  path ("cannot insert multiple commands into a prepared statement"), so the
   *  DDL needs its own channel. */
  exec(text: string): Promise<void>;
}

// Next.js reloads modules on every edit in dev; without a global the process
// would open a new database on each change and lose the cart.
const globalForDb = globalThis as unknown as {
  __agentCartDriver?: Promise<Driver>;
};

async function createDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL;

  if (url) {
    const { default: pg } = await import("pg");
    const pool = new pg.Pool({
      connectionString: url,
      // Hosted Postgres almost always terminates TLS with its own CA.
      ssl: url.includes("localhost") || url.includes("127.0.0.1") ? undefined : { rejectUnauthorized: false },
      max: 10,
    });
    return {
      kind: "postgres",
      async query<T>(text: string, params: unknown[] = []) {
        const result = await pool.query(text, params);
        return { rows: result.rows as T[] };
      },
      async exec(text: string) {
        // Omitting the params argument selects the simple query protocol,
        // which accepts several statements in one round trip.
        await pool.query(text);
      },
    };
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = path.join(process.cwd(), ".data", "pg");
  // PGlite creates its own data directory but not the parent chain.
  await mkdir(path.dirname(dataDir), { recursive: true });
  const db = new PGlite(dataDir);
  await db.waitReady;
  return {
    kind: "pglite",
    async query<T>(text: string, params: unknown[] = []) {
      const result = await db.query<T>(text, params as never[]);
      return { rows: result.rows };
    },
    async exec(text: string) {
      await db.exec(text);
    },
  };
}

function getDriver(): Promise<Driver> {
  if (!globalForDb.__agentCartDriver) {
    globalForDb.__agentCartDriver = createDriver().catch((err) => {
      delete globalForDb.__agentCartDriver;
      throw err;
    });
  }
  return globalForDb.__agentCartDriver;
}

/** Run a parameterized query. Always use $1/$2 placeholders — never interpolate. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const driver = await getDriver();
  const result = await driver.query<T>(text, params);
  return result.rows;
}

/** Convenience for queries that must return exactly zero or one row. */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function driverKind(): Promise<Driver["kind"]> {
  return (await getDriver()).kind;
}

let schemaReady: Promise<void> | undefined;

/** Apply the DDL. Idempotent — every statement is CREATE ... IF NOT EXISTS. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const driver = await getDriver();
      await driver.exec(DDL);
    })().catch((err) => {
      schemaReady = undefined;
      throw err;
    });
  }
  return schemaReady;
}
