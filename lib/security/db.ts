import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

let dbInstance: DatabaseSync | null = null;

export function getDatabasePath(dbName = "qshield.sqlite"): string {
  const dir = path.join(process.cwd(), ".qshield");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, dbName);
}

export function getDatabase(dbPath?: string): DatabaseSync {
  if (dbInstance && !dbPath) {
    return dbInstance;
  }

  const targetPath = dbPath ?? getDatabasePath();
  const db = new DatabaseSync(targetPath);

  // Enable WAL mode & foreign keys for performance and data safety
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS replay_ledger (
      signature_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      nonce TEXT NOT NULL,
      signer_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(session_id, nonce)
    );

    CREATE TABLE IF NOT EXISTS experiment_history (
      experiment_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      signature_id TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      seed INTEGER NOT NULL,
      attack_type TEXT,
      sample_count INTEGER NOT NULL,
      observed_errors INTEGER NOT NULL,
      error_rate REAL NOT NULL,
      threshold REAL NOT NULL,
      decision TEXT NOT NULL,
      risk_score REAL NOT NULL,
      chsh_s_value REAL,
      chsh_violation INTEGER,
      record_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      message TEXT NOT NULL,
      session_id TEXT,
      signature_id TEXT,
      signer_id TEXT,
      threat_type TEXT,
      risk_score REAL,
      event_json TEXT NOT NULL
    );
  `);

  if (!dbPath) {
    dbInstance = db;
  }

  return db;
}

export function resetDatabase(db?: DatabaseSync): void {
  const targetDb = db ?? getDatabase();
  targetDb.exec("DELETE FROM replay_ledger;");
  targetDb.exec("DELETE FROM experiment_history;");
  targetDb.exec("DELETE FROM security_events;");
}
