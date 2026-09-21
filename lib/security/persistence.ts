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
