import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import postgres from "postgres";
import * as schema from "./schema";

const databaseType = process.env.DATABASE_TYPE || "sqlite";
const databaseUrl = process.env.DATABASE_URL!;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

let db: ReturnType<typeof drizzleSqlite> | ReturnType<typeof drizzlePostgres>;

if (databaseType === "postgresql") {
  // PostgreSQL connection
  const client = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  db = drizzlePostgres(client, { schema });
} else if (databaseUrl.startsWith("libsql://") || databaseUrl.startsWith("file:")) {
  // Turso/LibSQL connection
  const client = createClient({
    url: databaseUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  db = drizzleLibsql(client, { schema });
} else {
  // Better-SQLite3 connection (local file)
  const sqlite = new Database(databaseUrl.replace("file:", ""));
  sqlite.pragma("journal_mode = WAL");
  db = drizzleSqlite(sqlite, { schema });
}

// Export database instance and schema
export { db, schema };

// Helper types
export type Database = typeof db;
