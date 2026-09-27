import { beforeEach, describe, expect, it } from "vitest";
import { getDatabase, resetDatabase } from "./db";
import {
  saveExperimentRecord,
  saveAttackRun,
  saveSecurityEvent,
  saveAuditLog,
  getRecentEvents,
  createUser,
  getUserByEmail,
  createSession,
  getSessionUser,
  deleteSession,
} from "./persistence";
import { runSecurityExperiment } from "./experiment";
import { ReplayLedger } from "./ledger";
import { simulateAttack } from "../quantum/attacks";

describe("Q-SHIELD Relational Persistence Architecture", () => {
  let ledger: ReplayLedger;

  beforeEach(() => {
    resetDatabase();
    ledger = new ReplayLedger({ memoryOnly: true });
  });

  it("initializes unified relational schema with foreign key constraints", () => {
    const db = getDatabase();

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as Array<{ name: string }>;

    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain("users");
    expect(tableNames).toContain("sessions");
    expect(tableNames).toContain("password_reset_tokens");
    expect(tableNames).toContain("signatures");
    expect(tableNames).toContain("experiment_runs");
    expect(tableNames).toContain("quantum_measurement_records");
    expect(tableNames).toContain("attack_runs");
    expect(tableNames).toContain("replay_ledger");
    expect(tableNames).toContain("security_events");
    expect(tableNames).toContain("audit_logs");
  });

  it("persists user registrations and sessions across queries", () => {
    const user = createUser({
      id: "USER-101",
      name: "Alice Quantum",
      email: "alice@qshield.test",
      passwordHash: "scrypt$hashed_password_string",
    });

    expect(user.id).toBe("USER-101");
    expect(user.email).toBe("alice@qshield.test");

    const fetched = getUserByEmail("alice@qshield.test");
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe("Alice Quantum");

    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    createSession({
      token: "TOKEN-ABC-123",
      userId: user.id,
      expiresAt,
    });

    const sessionUser = getSessionUser("TOKEN-ABC-123");
    expect(sessionUser).not.toBeNull();
    expect(sessionUser?.id).toBe("USER-101");

    deleteSession("TOKEN-ABC-123");
    expect(getSessionUser("TOKEN-ABC-123")).toBeNull();
  });

  it("persists security experiments relationally into signatures, experiment_runs, and measurement_records", () => {
    const db = getDatabase();

    const result = runSecurityExperiment(
      {
        experimentId: "EXP-PERSIST-001",
        sessionId: "SESS-PERSIST-001",
        signatureId: "SIG-PERSIST-001",
        signerId: "SIGNER-ALICE",
        message: "CONFIDENTIAL TRANSACTION PAYLOAD",
        nonce: "NONCE-8877",
        alpha: 0.8,
        beta: 0.6,
        shots: 1000,
        threshold: 0.05,
        seed: 42,
      },
      ledger
    );

    saveExperimentRecord(result);

    // Verify signatures entity row
    const sigRow = db
      .prepare("SELECT * FROM signatures WHERE signature_id = ?")
      .get("SIG-PERSIST-001") as { signature_id: string; message: string; signer_id: string } | undefined;

    expect(sigRow).toBeDefined();
    expect(sigRow?.message).toBe("CONFIDENTIAL TRANSACTION PAYLOAD");
    expect(sigRow?.signer_id).toBe("SIGNER-ALICE");

    // Verify experiment_runs entity row
    const expRow = db
      .prepare("SELECT * FROM experiment_runs WHERE experiment_id = ?")
      .get("EXP-PERSIST-001") as { decision: string; threshold: number; signature_id: string } | undefined;

    expect(expRow).toBeDefined();
    expect(expRow?.decision).toBe("ACCEPT");
    expect(expRow?.signature_id).toBe("SIG-PERSIST-001");

    // Verify quantum_measurement_records row
    const measRow = db
      .prepare("SELECT * FROM quantum_measurement_records WHERE experiment_id = ?")
      .get("EXP-PERSIST-001") as { total_samples: number; error_rate: number } | undefined;

    expect(measRow).toBeDefined();
    expect(measRow?.total_samples).toBe(1000);

    // Verify audit log entry
    const auditRow = db
      .prepare("SELECT * FROM audit_logs WHERE entity_id = ? AND action = 'EXPERIMENT_EXECUTION'")
      .get("EXP-PERSIST-001") as { status: string; actor_id: string } | undefined;

    expect(auditRow).toBeDefined();
    expect(auditRow?.actor_id).toBe("SIGNER-ALICE");
  });

  it("persists attack simulations and audit trails", () => {
    const db = getDatabase();

    const expResult = runSecurityExperiment(
      {
        experimentId: "EXP-ATTACK-001",
        sessionId: "SESS-ATTACK-001",
        signatureId: "SIG-ATTACK-001",
        signerId: "SIGNER-BOB",
        message: "ATTACK TEST PAYLOAD",
        nonce: "NONCE-ATTACK-99",
        alpha: 0.8,
        beta: 0.6,
        shots: 500,
        threshold: 0.05,
      },
      ledger
    );
    saveExperimentRecord(expResult);

    const attackRes = simulateAttack(
      {
        experimentId: "EXP-ATTACK-001",
        sessionId: "SESS-ATTACK-001",
        signatureId: "SIG-ATTACK-001",
        signerId: "SIGNER-BOB",
        message: "ATTACK TEST PAYLOAD",
        nonce: "NONCE-ATTACK-99",
        alpha: 0.8,
        beta: 0.6,
        shots: 500,
        threshold: 0.05,
      },
      {
        type: "FORGERY",
        intensity: 0.8,
      }
    );

    saveAttackRun(attackRes, "EXP-ATTACK-001");

    const attackRow = db
      .prepare("SELECT * FROM attack_runs WHERE experiment_id = ?")
      .get("EXP-ATTACK-001") as { attack_type: string; detected: number } | undefined;

    expect(attackRow).toBeDefined();
    expect(attackRow?.attack_type).toBe("FORGERY");
    expect(attackRow?.detected).toBe(1);

    const auditRow = db
      .prepare("SELECT * FROM audit_logs WHERE action = 'ATTACK_SIMULATION'")
      .get() as { status: string; entity_type: string } | undefined;

    expect(auditRow).toBeDefined();
    expect(auditRow?.entity_type).toBe("ATTACK_RUN");
    expect(auditRow?.status).toBe("SUCCESS");
  });

  it("enforces replay ledger uniqueness and exact tuple checks", () => {
    const persistentLedger = new ReplayLedger();
    persistentLedger.clear();

    const rec1 = persistentLedger.record("SIG-R1", "SESS-R1", "NONCE-R1", "SIGNER-X", 1000);
    expect(rec1.consumed).toBe(true);

    const checkRes = persistentLedger.check("SIG-R1", "SESS-R1", "NONCE-R1");
    expect(checkRes.fresh).toBe(false);

    expect(() => {
      persistentLedger.record("SIG-R1", "SESS-R1", "NONCE-R1", "SIGNER-X", 1000);
    }).toThrow();
  });

  it("persists security events and queries recent event stream", () => {
    saveSecurityEvent({
      id: "EV-TEST-100",
      type: "SIGNATURE_VERIFIED",
      severity: "INFO",
      timestamp: 1700000000000,
      message: "Signature verification test succeeded",
      signerId: "SIGNER-CHARLIE",
    });

    const recent = getRecentEvents(10);
    expect(recent.length).toBeGreaterThan(0);
    expect(recent[0].id).toBe("EV-TEST-100");
  });
});
