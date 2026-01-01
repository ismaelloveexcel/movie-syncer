import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Optional database connection. When DATABASE_URL is missing or invalid we
// intentionally fall back to in-memory storage so personal deployments keep
// working without manual setup.
function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    console.warn("No DATABASE_URL provided. Using in-memory storage.");
    return null;
  }

  try {
    return drizzle(postgres(databaseUrl), { schema });
  } catch (error) {
    console.warn("Failed to initialize database client. Falling back to in-memory storage.");
    console.error(error);
    return null;
  }
}

export const db = createDatabase();
