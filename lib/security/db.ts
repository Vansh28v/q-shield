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

  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build";

  // During `next build`, every worker gets its own in-memory database.
  // This prevents multiple build workers from locking the real SQLite file.
  const targetPath = isBuildPhase
    ? ":memory:"
    : (dbPath ?? getDatabasePath());

  const db = new DatabaseSync(targetPath);

  // WAL is only needed for the persistent runtime database.
  if (!isBuildPhase) {
    db.exec("PRAGMA journal_mode = WAL;");
  }

  db.exec("PRAGMA foreign_keys = ON;");

  // Initialize unified relational schema & indexes
  db.exec(`
    /* ----------------------------------------------------
     * 1. AUTHENTICATION & USER PERSISTENCE
     * ---------------------------------------------------- */
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );

    /* ----------------------------------------------------
     * 2. QUANTUM SIGNATURES ENTITY
     * ---------------------------------------------------- */
    CREATE TABLE IF NOT EXISTS signatures (
      signature_id TEXT PRIMARY KEY,
      message TEXT NOT NULL,
      signer_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      nonce TEXT NOT NULL,
      signature_length INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    /* ----------------------------------------------------
     * 3. REPLAY LEDGERS (BROAD & EXACT TUPLE)
     * ---------------------------------------------------- */
    CREATE TABLE IF NOT EXISTS replay_ledger (
      signature_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      nonce TEXT NOT NULL,
      signer_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(session_id, nonce)
    );

    CREATE TABLE IF NOT EXISTS qshield_exact_replay_ledger (
      signature_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      nonce TEXT NOT NULL,
      signer_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (signature_id, session_id, nonce)
    );

    /* ----------------------------------------------------
     * 4. EXPERIMENT RUNS & LEGACY HISTORY
     * ---------------------------------------------------- */
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

    CREATE TABLE IF NOT EXISTS experiment_runs (
      experiment_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      signature_id TEXT NOT NULL,
      signer_id TEXT NOT NULL,
      message TEXT NOT NULL,
      nonce TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      seed INTEGER NOT NULL,
      attack_type TEXT,
      sample_count INTEGER NOT NULL,
      observed_errors INTEGER NOT NULL,
      error_rate REAL NOT NULL,
      threshold REAL NOT NULL,
      decision TEXT NOT NULL,
      risk_score REAL NOT NULL,
      latency_ms REAL NOT NULL DEFAULT 0,
      chsh_s_value REAL,
      chsh_violation INTEGER,
      record_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (signature_id) REFERENCES signatures(signature_id) ON DELETE CASCADE
    );

    /* ----------------------------------------------------
     * 5. QUANTUM MEASUREMENT TELEMETRY RECORDS
     * ---------------------------------------------------- */
    CREATE TABLE IF NOT EXISTS quantum_measurement_records (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      signature_id TEXT NOT NULL,
      total_samples INTEGER NOT NULL,
      observed_errors INTEGER NOT NULL,
      error_rate REAL NOT NULL,
      threshold REAL NOT NULL,
      statistical_margin REAL,
      wilson_lower REAL,
      wilson_upper REAL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (experiment_id) REFERENCES experiment_runs(experiment_id) ON DELETE CASCADE,
      FOREIGN KEY (signature_id) REFERENCES signatures(signature_id) ON DELETE CASCADE
    );

    /* ----------------------------------------------------
     * 6. ATTACK SIMULATION RUNS
     * ---------------------------------------------------- */
    CREATE TABLE IF NOT EXISTS attack_runs (
      attack_id TEXT PRIMARY KEY,
      experiment_id TEXT,
      attack_type TEXT NOT NULL,
      intensity REAL NOT NULL,
      detected INTEGER NOT NULL,
      risk_score REAL NOT NULL,
      mechanism TEXT,
      evidence_json TEXT,
      latency_ms REAL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (experiment_id) REFERENCES experiment_runs(experiment_id) ON DELETE SET NULL
    );

    /* ----------------------------------------------------
     * 7. SECURITY EVENTS STREAM
     * ---------------------------------------------------- */
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

    /* ----------------------------------------------------
     * 8. IMMUTABLE SECURITY AUDIT LOGS
     * ---------------------------------------------------- */
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      actor_id TEXT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      status TEXT NOT NULL,
      details_json TEXT,
      created_at INTEGER NOT NULL
    );

    /* ----------------------------------------------------
     * 9. PERFORMANCE INDEXES
     * ---------------------------------------------------- */
    CREATE INDEX IF NOT EXISTS idx_sessions_token_expires ON sessions(token, expires_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_signatures_signer_nonce ON signatures(signer_id, nonce);
    CREATE INDEX IF NOT EXISTS idx_experiment_runs_timestamp ON experiment_runs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_experiment_runs_signature ON experiment_runs(signature_id);
    CREATE INDEX IF NOT EXISTS idx_quantum_measurements_exp ON quantum_measurement_records(experiment_id);
    CREATE INDEX IF NOT EXISTS idx_attack_runs_type ON attack_runs(attack_type);
    CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
  `);

  if (!dbPath) {
    dbInstance = db;
  }

  return db;
}

export function resetDatabase(db?: DatabaseSync): void {
  const targetDb = db ?? getDatabase();

  targetDb.exec("DELETE FROM users;");
  targetDb.exec("DELETE FROM sessions;");
  targetDb.exec("DELETE FROM password_reset_tokens;");
  targetDb.exec("DELETE FROM signatures;");
  targetDb.exec("DELETE FROM replay_ledger;");
  targetDb.exec("DELETE FROM qshield_exact_replay_ledger;");
  targetDb.exec("DELETE FROM experiment_history;");
  targetDb.exec("DELETE FROM experiment_runs;");
  targetDb.exec("DELETE FROM quantum_measurement_records;");
  targetDb.exec("DELETE FROM attack_runs;");
  targetDb.exec("DELETE FROM security_events;");
  targetDb.exec("DELETE FROM audit_logs;");
}