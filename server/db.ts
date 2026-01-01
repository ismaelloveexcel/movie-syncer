import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Optional database connection. In personal environments where DATABASE_URL
// isn't configured (or is misconfigured), we fall back to an in-memory store
// instead of crashing the whole server on startup.
function createDatabase() {
  if (!process.env.DATABASE_URL) return null;

  try {
    return drizzle(postgres(process.env.DATABASE_URL), { schema });
  } catch (error) {
    console.warn("Failed to initialize database client. Falling back to in-memory storage.");
    console.error(error);
    return null;
  }
}

export const db = createDatabase();
