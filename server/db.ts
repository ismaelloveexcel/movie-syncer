import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

let hasLoggedUnavailableDatabaseWarning = false;

function logDatabaseUnavailable(message?: string) {
  if (hasLoggedUnavailableDatabaseWarning) return;

  const fallbackMessage =
    "Database unavailable. Using in-memory storage for users, chat history, and movie lists (data resets on restart).";
  const warningMessage = message ? `${message} ${fallbackMessage}` : fallbackMessage;

  console.warn(warningMessage);
  hasLoggedUnavailableDatabaseWarning = true;
}

// Optional database connection. When DATABASE_URL is missing or invalid we
// intentionally fall back to in-memory storage so personal deployments keep
// working without manual setup.
function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    logDatabaseUnavailable();
    return null;
  }

  try {
    return drizzle(postgres(databaseUrl), { schema });
  } catch (error) {
    logDatabaseUnavailable("Failed to initialize database client. Falling back to in-memory storage.");
    console.error(error);
    return null;
  }
}

export const db = createDatabase();
