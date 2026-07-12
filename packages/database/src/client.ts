import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema/index.js";

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseClient {
  db: Database;
  /** Closes the underlying connection pool. Call during graceful shutdown. */
  close: () => Promise<void>;
}

export function createDatabaseClient(connectionString: string): DatabaseClient {
  const pool = new pg.Pool({ connectionString });
  return {
    db: drizzle(pool, { schema }),
    close: () => pool.end(),
  };
}
