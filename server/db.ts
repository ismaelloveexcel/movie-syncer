import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Optional database connection. In personal environments where DATABASE_URL
// isn't configured, we fall back to an in-memory store instead of crashing
// the whole server on startup.
export const db = process.env.DATABASE_URL
  ? drizzle(postgres(process.env.DATABASE_URL), { schema })
  : null;
