import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const databaseType = process.env.DATABASE_TYPE || "sqlite";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: databaseType === "postgresql" ? "postgresql" : "sqlite",
  dbCredentials:
    databaseType === "postgresql"
      ? {
          url: process.env.DATABASE_URL!,
        }
      : {
          url: process.env.DATABASE_URL || "file:./data/projectaware.db",
        },
  verbose: true,
  strict: true,
});
