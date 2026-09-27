import { getDatabase } from "./db";
import { SecurityEvent } from "./types";
import { SecurityExperimentResult } from "./experiment";
import { SignatureRecord } from "./signature";
import { AttackResult } from "../quantum/attacks";

export interface AuditLogInput {
  id?: string;
  action: string;
  actorId?: string;
  entityType: string;
  entityId: string;
  status: "SUCCESS" | "FAILURE" | "REJECTED";
  details?: Record<string, unknown>;
  createdAt?: number;
}

export function saveAuditLog(input: AuditLogInput): void {
  try {
    const db = getDatabase();
    const id = input.id ?? `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = input.createdAt ?? Date.now();

    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        id, action, actor_id, entity_type, entity_id, status, details_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.action,
      input.actorId ?? null,
      input.entityType,
      input.entityId,
      input.status,
      input.details ? JSON.stringify(input.details) : null,
      createdAt
    );
  } catch {
    // Gracefully handle persistence failure in read-only / test contexts
  }
}

export function saveSignatureRecord(record: SignatureRecord): void {
  try {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO signatures (
        signature_id, message, signer_id, session_id, nonce, signature_length, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.signatureId,
      record.message,
      record.signerId,
      record.sessionId,
      record.nonce,
      record.signatureLength ?? 1,
      record.createdAt
    );
  } catch {
    // Gracefully handle persistence failure
  }
}

export function saveExperimentRecord(result: SecurityExperimentResult): void {
  try {
    const db = getDatabase();

    // 1. Ensure signature record exists
    saveSignatureRecord(result.signature);

    // 2. Legacy experiment_history table (Backward Compatibility)
    const historyStmt = db.prepare(`
      INSERT OR REPLACE INTO experiment_history (
        experiment_id, session_id, signature_id, timestamp, seed,
        attack_type, sample_count, observed_errors, error_rate,
        threshold, decision, risk_score, chsh_s_value, chsh_violation, record_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    historyStmt.run(
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

    // 3. Upgraded relational experiment_runs table
    const runsStmt = db.prepare(`
      INSERT OR REPLACE INTO experiment_runs (
        experiment_id, session_id, signature_id, signer_id, message, nonce,
        timestamp, seed, attack_type, sample_count, observed_errors, error_rate,
        threshold, decision, risk_score, latency_ms, chsh_s_value, chsh_violation,
        record_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    runsStmt.run(
      result.experimentId,
      result.session.sessionId,
      result.signature.signatureId,
      result.signature.signerId,
      result.signature.message,
      result.signature.nonce,
      result.createdAt,
      result.quantum.chsh?.seed ?? 12345,
      result.threat.threatType !== "NONE" ? result.threat.threatType : null,
      result.quantum.verification.totalSamples ?? result.quantum.measurement.shots,
      result.quantum.verification.observedErrors ?? Math.round(result.quantum.verification.deviation * result.quantum.measurement.shots),
      result.quantum.verification.observedErrorRate ?? result.quantum.verification.deviation,
      result.quantum.verification.threshold,
      result.quantum.verification.decision,
      result.threat.riskScore,
      result.latencyMs ?? 0,
      result.quantum.chsh?.S ?? null,
      result.quantum.chsh?.violatesClassicalBound ? 1 : 0,
      JSON.stringify(result),
      result.createdAt
    );

    // 4. Quantum measurement record table
    const measId = `MEAS-${result.experimentId}`;
    const measStmt = db.prepare(`
      INSERT OR REPLACE INTO quantum_measurement_records (
        id, experiment_id, signature_id, total_samples, observed_errors,
        error_rate, threshold, statistical_margin, wilson_lower, wilson_upper, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    measStmt.run(
      measId,
      result.experimentId,
      result.signature.signatureId,
      result.quantum.verification.totalSamples ?? result.quantum.measurement.shots,
      result.quantum.verification.observedErrors ?? Math.round(result.quantum.verification.deviation * result.quantum.measurement.shots),
      result.quantum.verification.observedErrorRate ?? result.quantum.verification.deviation,
      result.quantum.verification.threshold,
      result.signatureVerification.statisticalMargin ?? null,
      result.signatureVerification.confidenceInterval?.lower ?? null,
      result.signatureVerification.confidenceInterval?.upper ?? null,
      result.createdAt
    );

    // 5. Save audit log for experiment execution
    saveAuditLog({
      action: "EXPERIMENT_EXECUTION",
      actorId: result.signature.signerId,
      entityType: "EXPERIMENT",
      entityId: result.experimentId,
      status: result.quantum.verification.accepted ? "SUCCESS" : "REJECTED",
      details: {
        decision: result.quantum.verification.decision,
        riskScore: result.threat.riskScore,
        threatType: result.threat.threatType
      },
      createdAt: result.createdAt
    });
  } catch {
    // Gracefully handle persistence failure
  }
}

export function saveAttackRun(attackResult: AttackResult, experimentId?: string): void {
  try {
    const db = getDatabase();
    const attackId = `ATTACK-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = Date.now();
    let expId: string | null = experimentId ?? (attackResult.experiment as unknown as { experimentId?: string }).experimentId ?? null;
    if (expId) {
      const exists = db.prepare("SELECT 1 FROM experiment_runs WHERE experiment_id = ? LIMIT 1").get(expId);
      if (!exists) {
        expId = null;
      }
    }

    const stmt = db.prepare(`
      INSERT INTO attack_runs (
        attack_id, experiment_id, attack_type, intensity, detected,
        risk_score, mechanism, evidence_json, latency_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const latency = (attackResult.experiment as unknown as { latencyMs?: number }).latencyMs ?? null;

    stmt.run(
      attackId,
      expId,
      attackResult.attackType,
      attackResult.intensity,
      attackResult.detected ? 1 : 0,
      attackResult.riskScore,
      attackResult.mechanism,
      JSON.stringify(attackResult.evidence ? [attackResult.evidence] : []),
      latency,
      createdAt
    );

    saveAuditLog({
      action: "ATTACK_SIMULATION",
      actorId: (attackResult.experiment as unknown as { signerId?: string }).signerId ?? "SYSTEM",
      entityType: "ATTACK_RUN",
      entityId: attackId,
      status: attackResult.detected ? "SUCCESS" : "FAILURE",
      details: {
        attackType: attackResult.attackType,
        detected: attackResult.detected,
        riskScore: attackResult.riskScore
      },
      createdAt
    });
  } catch {
    // Gracefully handle persistence failure
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
  const db = getDatabase();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

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
  const db = getDatabase();
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, created_at, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(input.token, input.userId, createdAt, input.expiresAt);
}

export function getSessionUser(token: string): PublicUser | null {
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