import { config } from "@/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "@neondatabase/serverless";
import { Pool as PgPool } from "pg";
import * as schemas from "@/db/models";

// ────────────────────────────────────────────────
// Choose connection pool based on environment
// ────────────────────────────────────────────────

let pool: Pool | PgPool;

if (config.NODE_ENV === "development") {
    // ── Development: use normal PostgreSQL (pg) ─────
    pool = new PgPool({
        connectionString: config.DATABASE_URL!,
        // optional: you can override some settings for local dev
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    console.info("[DB] Using normal PostgreSQL driver (development mode)");
} else {
    // ── Staging / Production: use Neon serverless ───
    pool = new Pool({ connectionString: config.DATABASE_URL! });
    console.info("[DB] Using Neon serverless driver");
}

// ────────────────────────────────────────────────
// Create drizzle instance
// ────────────────────────────────────────────────

const db: ReturnType<typeof drizzle<typeof schemas>> = drizzle(pool, {
    schema: schemas,
    casing: "snake_case", // keeps `usersTable` → `users` in DB
    logger: config.NODE_ENV === "development", // verbose logging only in dev
});

export default db;

export type DbConfig = typeof db;