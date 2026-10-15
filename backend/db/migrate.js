import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../db.js";

const migrationPath = fileURLToPath(
  new URL("../migrations/001_initial.sql", import.meta.url),
);
const migrationSql = await readFile(migrationPath, "utf8");

export async function migrateDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [76298431]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rowCount } = await client.query(
      "SELECT name FROM schema_migrations WHERE name = $1",
      [path.basename(migrationPath)],
    );

    if (!rowCount) {
      await client.query(migrationSql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        path.basename(migrationPath),
      ]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
