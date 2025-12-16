import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const databaseType = process.env.DATABASE_TYPE || "sqlite";
const schemaPath = databaseType === "postgresql" 
  ? "./src/db/schema/postgres/**/*.schema.ts"
  : "./src/db/schema/sqlite/**/*.schema.ts";

export default defineConfig({
  schema: schemaPath,
  out: "./src/db/migrations",
  dialect: databaseType === "postgresql" ? "postgresql" : "sqlite",
  dbCredentials:
    databaseType === "postgresql"
      ? {
          url: process.env.DATABASE_URL!,
        }
      : {
          url: "./data/projectaware.db",
        },
  verbose: true,
  strict: true,
});
