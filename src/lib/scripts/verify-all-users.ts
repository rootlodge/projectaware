
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Verifying all users...");
  await db.update(users).set({ emailVerified: true, email_verified: true }); // handle both just in case of mapping weirdness, though usage is usually via variable
  // Actually schema.users uses `emailVerified` (boolean) field name in mapping, but some db columns might differ. 
  // Checking schema: `emailVerified: boolean("email_verified")` (pg) or `integer` (sqlite).
  // Drizzle ORM handles the key mapping key->column. So we use the key `emailVerified`.
  
  await db.update(users).set({ emailVerified: true });
  console.log("All users verified.");
  process.exit(0);
}

main().catch(console.error);
