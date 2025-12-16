import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";

import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import postgres from "postgres";

import * as schema from "./schema";

const databaseType = process.env.DATABASE_TYPE ?? "sqlite";
const databaseUrl = process.env.DATABASE_URL as string;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

export function createDb() {
  if (databaseType === "postgresql") {
    const client = postgres(databaseUrl, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    return drizzlePostgres(client, { schema });
  }

  if (
    databaseUrl.startsWith("libsql://") ||
    databaseUrl.startsWith("file:")
  ) {
    const client = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    return drizzleLibsql(client, { schema });
  }

  const sqlite = new Database(databaseUrl.replace("file:", ""));
  sqlite.pragma("journal_mode = WAL");

  return drizzleSqlite(sqlite, { schema });
}

// ⚠️ single export boundary
export const db = createDb();
export type Database = typeof db;
export { schema };
