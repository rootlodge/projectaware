import * as dotenv from "dotenv";
dotenv.config();

import { eq } from "drizzle-orm"; // drizzle-orm is fine to import statically

async function main() {
  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");

  console.log("Verifying all users...");
  
  await db.update(users).set({ emailVerified: true });
  console.log("All users verified.");
  process.exit(0);
}

main().catch(console.error);
