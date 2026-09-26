import { getDatabase } from "./db";
import { SecurityEvent } from "./types";
import { SecurityExperimentResult } from "./experiment";

export function saveExperimentRecord(result: SecurityExperimentResult): void {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO experiment_history (
        experiment_id, session_id, signature_id, timestamp, seed,
        attack_type, sample_count, observed_errors, error_rate,
        threshold, decision, risk_score, chsh_s_value, chsh_violation, record_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      result.experimentId,
      result.session.sessionId,
      result.signature.signatureId,
      result.createdAt,
      result.quantum.chsh?.seed ?? 12345,
      result.threat.threatType !== "NONE" ? result.threat.threatType : null,
      result.quantum.verification.totalSamples ?? result.quantum.measurement.shots,
      result.quantum.verification.observedErrors ?? Math.round(result.quantum.verification.deviation * result.quantum.measurement.shots),
      result.quantum.verification.observedErrorRate ?? result.quantum.verification.deviation,
      result.quantum.verification.threshold,
      result.quantum.verification.decision,
      result.threat.riskScore,
      result.quantum.chsh?.S ?? null,
      result.quantum.chsh?.violatesClassicalBound ? 1 : 0,
      JSON.stringify(result)
    );
  } catch {
    // Gracefully handle persistence failure in read-only / test contexts
  }
}

export function saveSecurityEvent(event: SecurityEvent): void {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO security_events (
        id, type, severity, timestamp, message, session_id,
        signature_id, signer_id, threat_type, risk_score, event_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.id,
      event.type,
      event.severity,
      event.timestamp,
      event.message,
      event.sessionId ?? null,
      event.signatureId ?? null,
      event.signerId ?? null,
      event.threatType ?? null,
      event.riskScore ?? null,
      JSON.stringify(event)
    );
  } catch {
    // Gracefully handle persistence failure
  }
}

export function getRecentEvents(limit = 50): SecurityEvent[] {
  try {
    const db = getDatabase();
    const stmt = db.prepare(
      "SELECT event_json FROM security_events ORDER BY timestamp DESC LIMIT ?"
    );
    const rows = stmt.all(limit) as Array<{ event_json: string }>;
    return rows.map((r) => JSON.parse(r.event_json) as SecurityEvent);
  } catch {
    return [];
  }
}

/* ============================== */
/* AUTHENTICATION                 */
/* ============================== */
//
// Reuses the existing SQLite database (getDatabase()) rather than
// introducing a second persistence system. Tables are created lazily,
// idempotently, the first time any auth function runs.

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
};

let authTablesReady = false;

function ensureAuthTables(): void {
  if (authTablesReady) return;

  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );
  `);

  authTablesReady = true;
}

function rowToUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export function createUser(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}): StoredUser {
  ensureAuthTables();

  const db = getDatabase();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Lets a UNIQUE constraint violation (duplicate email) propagate to the
  // caller as a thrown error, rather than being silently swallowed like
  // the telemetry functions above — signup needs to know if this failed.
  stmt.run(input.id, input.name, input.email, input.passwordHash, createdAt);

  return {
    id: input.id,
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    createdAt,
  };
}

export function getUserByEmail(email: string): StoredUser | null {
  ensureAuthTables();

  try {
    const db = getDatabase();
    const row = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as UserRow | undefined;

    return row ? rowToUser(row) : null;
  } catch {
    return null;
  }
}

export function getUserById(id: string): StoredUser | null {
  ensureAuthTables();

  try {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
      | UserRow
      | undefined;

    return row ? rowToUser(row) : null;
  } catch {
    return null;
  }
}

export function createSession(input: {
  token: string;
  userId: string;
  expiresAt: string;
}): void {
  ensureAuthTables();

  const db = getDatabase();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(input.token, input.userId, createdAt, input.expiresAt);
}

export function getSessionUser(token: string): PublicUser | null {
  ensureAuthTables();

  try {
    const db = getDatabase();
    const row = db
      .prepare("SELECT user_id, expires_at FROM sessions WHERE token = ?")
      .get(token) as { user_id: string; expires_at: string } | undefined;

    if (!row) return null;

    if (new Date(row.expires_at).getTime() < Date.now()) {
      db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
      return null;
    }

    const user = getUserById(row.user_id);
    return user ? toPublicUser(user) : null;
  } catch {
    return null;
  }
}

export function deleteSession(token: string): void {
  ensureAuthTables();

  try {
    const db = getDatabase();
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  } catch {
    // Gracefully handle persistence failure
  }
}

export function createPasswordResetToken(input: {
  token: string;
  userId: string;
  expiresAt: string;
}): void {
  ensureAuthTables();

  try {
    const db = getDatabase();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO password_reset_tokens (token, user_id, created_at, expires_at, used)
      VALUES (?, ?, ?, ?, 0)
    `).run(input.token, input.userId, createdAt, input.expiresAt);
  } catch {
    // Gracefully handle persistence failure
  }
}