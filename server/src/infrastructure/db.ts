import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export type Db = Database.Database;

/**
 * SQLite stands in for SQL Server here so the repo runs with one `npm install`.
 * The schema is deliberately written the way it would be on a real server:
 * explicit types, foreign keys on, and an index that matches the read pattern.
 */
export function openDatabase(file = process.env.DATABASE_FILE ?? 'token-ledger.db'): Db {
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

export function migrate(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id             TEXT PRIMARY KEY,
      email          TEXT NOT NULL UNIQUE,
      password_hash  TEXT NOT NULL,
      display_name   TEXT NOT NULL,
      monthly_budget REAL NOT NULL DEFAULT 50
    );

    CREATE TABLE IF NOT EXISTS usage_events (
      id                TEXT PRIMARY KEY,
      user_id           TEXT NOT NULL REFERENCES users(id),
      model             TEXT NOT NULL,
      provider          TEXT NOT NULL,
      prompt_tokens     INTEGER NOT NULL,
      completion_tokens INTEGER NOT NULL,
      latency_ms        INTEGER NOT NULL,
      occurred_at       TEXT NOT NULL
    );

    -- The dashboard always reads "one user, newest first, within a window".
    -- A composite index on exactly that shape keeps the query off a table scan.
    CREATE INDEX IF NOT EXISTS ix_usage_user_time
      ON usage_events (user_id, occurred_at DESC);
  `);
}

/** Two accounts and a week of traffic, so the dashboard has something to show. */
export function seed(db: Db): void {
  const existing = db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number };
  if (existing.n > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (id, email, password_hash, display_name, monthly_budget) VALUES (?, ?, ?, ?, ?)',
  );
  insertUser.run('u_demo', 'demo@token-ledger.dev', bcrypt.hashSync('demo1234', 10), 'Demo Analyst', 25);
  insertUser.run('u_ops', 'ops@token-ledger.dev', bcrypt.hashSync('ops12345', 10), 'Platform Ops', 120);

  const models = [
    ['gpt-4o-mini', 'azure-openai'],
    ['gpt-4o', 'azure-openai'],
    ['mistral-large', 'azure-mistral'],
    ['claude-sonnet', 'bedrock-claude'],
    ['claude-haiku', 'bedrock-claude'],
  ] as const;

  const insertEvent = db.prepare(`
    INSERT INTO usage_events
      (id, user_id, model, provider, prompt_tokens, completion_tokens, latency_ms, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const write = db.transaction(() => {
    for (let i = 0; i < 60; i += 1) {
      const pick = models[i % models.length]!;
      const occurredAt = new Date(Date.now() - i * 2.4 * 60 * 60 * 1000).toISOString();
      insertEvent.run(
        `e_seed_${i}`,
        i % 4 === 0 ? 'u_ops' : 'u_demo',
        pick[0],
        pick[1],
        400 + ((i * 137) % 3200),
        120 + ((i * 61) % 900),
        300 + ((i * 53) % 2400),
        occurredAt,
      );
    }
  });
  write();
}
